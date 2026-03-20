import crypto from "crypto";
import { Router, Request, Response } from "express";
import WDK from "@tetherto/wdk";
import WalletManagerEvm from "@tetherto/wdk-wallet-evm";

const router = Router();

const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC!;
const USDT_CONTRACT_ADDRESS = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
const USDT_DECIMALS = 6;
const INDEXER_BASE_URL = "https://wdk-api.tether.io";

// Fallback gas config used when the Base gas station times out
const BASE_GAS_CONFIG = {
  provider: BASE_RPC_URL,
  gasPrice: 100_000_000n,                 // 0.1 gwei (example for Base)
  transferMaxFee: 1_000_000_000_000_000n, // max fee cap
} as const;

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

// Alternate nodes to fallback to if one is rate-limiting
const RPC_NODES = [
  BASE_RPC_URL,
  "https://base.llamarpc.com",
  "https://base.meowrpc.com",
  "https://1rpc.io/base" // only supports standard RPC methods
];

async function rpcFetch(body: any): Promise<any> {
  const bodyStr = JSON.stringify(body);
  for (let attempt = 0; attempt < 5; attempt++) {
    for (const rpc of RPC_NODES) {
      try {
        const res = await fetch(rpc, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: bodyStr
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.error) throw new Error(data.error.message);
          return data;
        }

        if (res.status === 429) {
          // If 429, try the next node immediately
          continue;
        }
        
        throw new Error(`RPC status ${res.status}`);
      } catch (err: any) {
        // If it's the last node and last attempt, throw
        if (rpc === RPC_NODES[RPC_NODES.length - 1] && attempt === 4) {
          throw err;
        }
      }
    }
    // Wait before retrying entire list
    await new Promise(r => setTimeout(r, 500 + attempt * 500));
  }
  throw new Error("All RPC nodes exhausted");
}

// Carries an HTTP status so the outer handler can forward the right code
class WdkError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "WdkError";
  }
}

function classifyTransferError(raw: string): WdkError {
  const lower = raw.toLowerCase();
  if (
    lower.includes("insufficient funds") ||
    (lower.includes("insufficient") && (lower.includes("gas") || lower.includes("native") || lower.includes("eth")))
  ) {
    return new WdkError(
      "Insufficient ETH for gas fees. Send a small amount of ETH (0.001+) to the agent wallet address to cover transaction fees.",
      400
    );
  }
  if (
    lower.includes("execution reverted") ||
    (lower.includes("insufficient") && (lower.includes("balance") || lower.includes("token") || lower.includes("usdt") || lower.includes("erc20")))
  ) {
    return new WdkError(
      "Insufficient USDT balance. Agent wallet does not have enough USDT to cover this withdrawal.",
      400
    );
  }
  if (lower.includes("user rejected") || lower.includes("rejected") || lower.includes("denied")) {
    return new WdkError("Transaction rejected.", 400);
  }
  if (lower.includes("timeout") || lower.includes("gas station") || lower.includes("congested")) {
    return new WdkError("Base network is congested. Please try again in a few seconds.", 503);
  }
  if (lower.includes("fetch") || lower.includes("network") || lower.includes("econnrefused") || lower.includes("etimedout")) {
    return new WdkError("Could not reach Base network. Check your internet connection and try again.", 503);
  }
  return new WdkError(`Transaction failed: ${raw}`, 500);
}

function indexerHeaders(): Record<string, string> {
  return { "x-api-key": process.env.WDK_INDEXER_API_KEY! };
}

function deriveKey(): Buffer {
  return crypto.createHash("sha256").update(process.env.AGENT_ENCRYPTION_KEY!).digest();
}

// Format: iv_hex:auth_tag_hex:ciphertext_hex
function encryptSeed(seedPhrase: string): string {
  const key = deriveKey();
  console.log("[encrypt] derived key (first 4 bytes):", key.slice(0, 4).toString("hex"));
  console.log("[encrypt] derived key (first 4 bytes):", crypto.createHash("sha256").update(process.env.AGENT_ENCRYPTION_KEY!).digest().slice(0, 4).toString("hex"));
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(seedPhrase, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const result = `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
  console.log("[encrypt] iv length:", iv.toString("hex").length, "authTag length:", authTag.toString("hex").length, "ciphertext length:", ciphertext.toString("hex").length);
  return result;
}

function decryptSeed(encryptedSeed: string): string {
  const parts = encryptedSeed.split(":");
  if (parts.length !== 3) {
    throw new Error(`Invalid encrypted seed format: expected 3 parts separated by ':', got ${parts.length}`);
  }
  const [ivHex, authTagHex, ciphertextHex] = parts;
  console.log("[decrypt] iv length:", ivHex.length, "(expect 24)");
  console.log("[decrypt] authTag length:", authTagHex.length, "(expect 32)");
  console.log("[decrypt] ciphertext length:", ciphertextHex.length);
  if (!ivHex || !authTagHex || !ciphertextHex) throw new Error("Invalid encrypted seed format: one or more parts are empty");
  const key = deriveKey();
  console.log("[decrypt] derived key (first 4 bytes):", key.slice(0, 4).toString("hex"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  // setAuthTag MUST be called before update/final
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
    const wdk = new WDK(seedPhrase).registerWallet("base", WalletManagerEvm, {
      provider: BASE_RPC_URL,
    });
    const account = await wdk.getAccount("base", 0);
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

  console.log("[decrypt] encryptedSeed length:", fromEncryptedSeed.length);
  console.log("[decrypt] encryptedSeed preview:", fromEncryptedSeed.slice(0, 40));

  try {
    // Decrypt — failure here is a system error, not a user error
    let seedPhrase: string;
    try {
      seedPhrase = decryptSeed(fromEncryptedSeed);
    } catch {
      throw new WdkError("Could not decrypt agent wallet. Contact support.", 500);
    }

    const amountBaseUnits = BigInt(Math.round(parseFloat(amountUsdt) * 10 ** USDT_DECIMALS));
    const transferPayload = {
      token: USDT_CONTRACT_ADDRESS,
      recipient: toAddress,
      amount: amountBaseUnits,
    };

    let result: { hash: string };
    try {
      // First attempt: let WDK fetch gas price from gas station
      const wdk = new WDK(seedPhrase).registerWallet("base", WalletManagerEvm, {
        provider: BASE_RPC_URL,
      });
      const account = await wdk.getAccount("base", 0);
      result = await account.transfer(transferPayload);
      account.dispose();
      wdk.dispose();
    } catch (firstErr) {
      const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
      const lower = msg.toLowerCase();

      // Only retry transient gas station / network errors, not balance or rejection errors
      const isRetryable =
        (lower.includes("gas") && !lower.includes("insufficient funds")) ||
        lower.includes("timeout") ||
        lower.includes("fetch") ||
        lower.includes("network") ||
        lower.includes("etimedout");

      if (!isRetryable) {
        throw classifyTransferError(msg);
      }

      // Retry with hardcoded gas config
      console.warn("[send] network/gas station error, retrying with fallback gas config:", msg);
      try {
        const wdk2 = new WDK(seedPhrase).registerWallet("base", WalletManagerEvm, BASE_GAS_CONFIG);
        const account2 = await wdk2.getAccount("base", 0);
        result = await account2.transfer(transferPayload);
        account2.dispose();
        wdk2.dispose();
      } catch (retryErr) {
        throw classifyTransferError(retryErr instanceof Error ? retryErr.message : String(retryErr));
      }
    }

    res.json({ txHash: result.hash });
  } catch (error) {
    if (error instanceof WdkError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      const msg = error instanceof Error ? error.message : "Send failed";
      res.status(500).json({ error: `Transaction failed: ${msg}` });
    }
  }
});

// GET /wallet/balance/:address
router.get("/balance/:address", async (req: Request, res: Response): Promise<void> => {
  const address = req.params.address as string;

  if (typeof address !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    res.status(400).json({ error: "Invalid wallet address format." });
    return;
  }

  try {
    const addressParam = address.toLowerCase().replace("0x", "").padStart(64, "0");
    const dataPayload = "0x70a08231" + addressParam;

    const rpcData = await rpcFetch({
      jsonrpc: "2.0", id: 1, method: "eth_call",
      params: [{ to: USDT_CONTRACT_ADDRESS, data: dataPayload }, "latest"]
    });

    if (rpcData.result && rpcData.result !== '0x') {
      const balanceDecimals = BigInt(rpcData.result);
      const balance = (Number(balanceDecimals) / (10 ** USDT_DECIMALS)).toString();
      res.json({ balance, address });
    } else {
      res.json({ balance: "0", address });
    }
  } catch (error: any) {
    console.error(`[wdk-service] Network/Fetch error fetching balance for ${address}:`, error.message);
    res.status(500).json({ error: `Fetch error: ${error.message}` });
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
    
    // Topic: Transfer(address,address,uint256)
    const topic0 = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const topic2 = "0x" + walletAddress.toLowerCase().replace("0x", "").padStart(64, "0");

    while (Date.now() < deadline) {
      try {
        // Calculate safe fromBlock (assuming ~2s block time on Base)
        const secondsAgo = Math.max(0, Math.floor((Date.now() - afterTimestamp) / 1000));
        const blocksAgo = Math.ceil(secondsAgo / 2) + 20; // 20 blocks buffer
        
        // Fetch current block
        let rpcData = await rpcFetch({ 
          jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] 
        });
        const latestBlockNum = parseInt(rpcData.result, 16);
        const fromBlockHex = "0x" + Math.max(0, latestBlockNum - Math.min(blocksAgo, 2000)).toString(16);

        rpcData = await rpcFetch({
          jsonrpc: "2.0", id: 2, method: "eth_getLogs",
          params: [{ fromBlock: fromBlockHex, toBlock: "latest", address: USDT_CONTRACT_ADDRESS, topics: [topic0, null, topic2] }]
        });
        const logs: any[] = rpcData.result || [];

        for (const log of logs) {
          const amountTransfer = Number(BigInt(log.data)) / (10 ** USDT_DECIMALS);
          if (amountTransfer >= expectedAmount) {
            res.json({ confirmed: true, txHash: log.transactionHash });
            return;
          }
        }
      } catch (e: any) {
        console.warn("[wdk-service] Polling error:", e.message);
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
    const rpcData = await rpcFetch({
      jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt",
      params: [txHash]
    });
    const receipt = rpcData.result;

    if (!receipt) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    
    // Check if it's a success
    if (receipt.status === "0x1" || receipt.status === "0x01" || receipt.status === 1) {
       res.json({ transactionHash: txHash, status: "SUCCESS", receipt });
    } else {
       res.status(400).json({ error: "Transaction failed on chain", receipt });
    }
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
