import crypto from "crypto";
import { Router, Request, Response } from "express";
import WDK from "@tetherto/wdk";
import WalletManagerEvm from "@tetherto/wdk-wallet-evm";

const router = Router();

const POLYGON_RPC_URL = process.env.NEXT_PUBLIC_POLYGON_RPC!;
const USDT_CONTRACT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
const USDT_DECIMALS = 6;
const INDEXER_BASE_URL = "https://wdk-api.tether.io";
const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

function indexerHeaders(): Record<string, string> {
  return { "x-api-key": process.env.WDK_INDEXER_API_KEY! };
}

function deriveKey(): Buffer {
  return crypto.createHash("sha256").update(process.env.AGENT_ENCRYPTION_KEY!).digest();
}

// Format: iv_hex:auth_tag_hex:ciphertext_hex
function encryptSeed(seedPhrase: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(seedPhrase, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

function decryptSeed(encryptedSeed: string): string {
  const [ivHex, authTagHex, ciphertextHex] = encryptedSeed.split(":");
  if (!ivHex || !authTagHex || !ciphertextHex) throw new Error("Invalid encrypted seed format");
  const key = deriveKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

// POST /wallet/create
router.post("/create", async (_req: Request, res: Response): Promise<void> => {
  try {
    const seedPhrase = WDK.getRandomSeedPhrase();
    const wdk = new WDK(seedPhrase).registerWallet("polygon", WalletManagerEvm, {
      provider: POLYGON_RPC_URL,
    });
    const account = await wdk.getAccount("polygon", 0);
    const address = await account.getAddress();
    account.dispose();
    wdk.dispose();

    const encryptedSeed = encryptSeed(seedPhrase);
    res.json({ address, encryptedSeed });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Wallet creation failed" });
  }
});

// POST /wallet/send
router.post("/send", async (req: Request, res: Response): Promise<void> => {
  const { fromEncryptedSeed, toAddress, amountUsdt } = req.body as {
    fromEncryptedSeed: string;
    toAddress: string;
    amountUsdt: string;
  };

  if (!fromEncryptedSeed || !toAddress || !amountUsdt) {
    res.status(400).json({ error: "fromEncryptedSeed, toAddress, and amountUsdt are required" });
    return;
  }

  try {
    const seedPhrase = decryptSeed(fromEncryptedSeed);
    const amountBaseUnits = BigInt(Math.round(parseFloat(amountUsdt) * 10 ** USDT_DECIMALS));

    const wdk = new WDK(seedPhrase).registerWallet("polygon", WalletManagerEvm, {
      provider: POLYGON_RPC_URL,
    });
    const account = await wdk.getAccount("polygon", 0);
    const result = await account.transfer({
      token: USDT_CONTRACT_ADDRESS,
      recipient: toAddress,
      amount: amountBaseUnits,
    });
    account.dispose();
    wdk.dispose();

    res.json({ txHash: result.hash });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Send failed" });
  }
});

// GET /wallet/balance/:address
router.get("/balance/:address", async (req: Request, res: Response): Promise<void> => {
  const { address } = req.params;

  try {
    const url = `${INDEXER_BASE_URL}/api/v1/polygon/usdt/${address}/token-balances`;
    const indexerRes = await fetch(url, { headers: indexerHeaders() });

    if (!indexerRes.ok) {
      res.status(502).json({ error: `Indexer error: ${indexerRes.status}` });
      return;
    }

    const data = (await indexerRes.json()) as { tokenBalance: { amount: string } };
    res.json({ balance: data.tokenBalance.amount, address });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Balance fetch failed" });
  }
});

// POST /wallet/verify-payment
router.post("/verify-payment", async (req: Request, res: Response): Promise<void> => {
  const { walletAddress, expectedAmountUsdt, afterTimestamp } = req.body as {
    walletAddress: string;
    expectedAmountUsdt: string;
    afterTimestamp: number;
  };

  if (!walletAddress || !expectedAmountUsdt || afterTimestamp === undefined) {
    res.status(400).json({ error: "walletAddress, expectedAmountUsdt, and afterTimestamp are required" });
    return;
  }

  try {
    const expectedAmount = parseFloat(expectedAmountUsdt);
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      try {
        const url = `${INDEXER_BASE_URL}/api/v1/polygon/usdt/${walletAddress}/token-transfers?fromTs=${afterTimestamp}&sort=desc&limit=20`;
        const indexerRes = await fetch(url, { headers: indexerHeaders() });

        if (indexerRes.ok) {
          const data = (await indexerRes.json()) as {
            transfers: Array<{ to: string; amount: string; transactionHash: string }>;
          };

          for (const transfer of data.transfers) {
            if (
              transfer.to.toLowerCase() === walletAddress.toLowerCase() &&
              parseFloat(transfer.amount) >= expectedAmount
            ) {
              res.json({ confirmed: true, txHash: transfer.transactionHash });
              return;
            }
          }
        }
      } catch {
        // Swallow transient errors and continue polling
      }

      await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    res.json({ confirmed: false });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Payment verification failed" });
  }
});

// GET /wallet/transaction/:txHash
router.get("/transaction/:txHash", async (req: Request, res: Response): Promise<void> => {
  const { txHash } = req.params;

  try {
    const url = `${INDEXER_BASE_URL}/api/v1/polygon/usdt/${txHash}/token-transfers`;
    const indexerRes = await fetch(url, { headers: indexerHeaders() });

    if (!indexerRes.ok) {
      res.status(502).json({ error: `Indexer error: ${indexerRes.status}` });
      return;
    }

    const data = (await indexerRes.json()) as {
      transfers: Array<{ transactionHash: string; [key: string]: unknown }>;
    };
    const tx = data.transfers.find((t) => t.transactionHash === txHash);

    if (!tx) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    res.json(tx);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Transaction fetch failed" });
  }
});

// POST /wallet/decrypt
router.post("/decrypt", (req: Request, res: Response): void => {
  const { encryptedSeed } = req.body as { encryptedSeed: string };

  if (!encryptedSeed) {
    res.status(400).json({ error: "encryptedSeed is required" });
    return;
  }

  try {
    const seedPhrase = decryptSeed(encryptedSeed);
    res.json({ seedPhrase });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Decryption failed" });
  }
});

export { router as walletRouter };
