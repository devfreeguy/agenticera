const INDEXER_BASE_URL = "https://wdk-api.tether.io";
const BLOCKCHAIN = "base";
const TOKEN = "usdt";

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

type IndexerTransfer = {
  blockchain: string;
  blockNumber: number;
  transactionHash: string;
  token: string;
  amount: string;
  timestamp: number;
  from: string;
  to: string;
};

type IndexerTokenBalance = {
  blockchain: string;
  token: string;
  amount: string;
};

type IndexerTransfersResponse = {
  transfers: IndexerTransfer[];
};

type IndexerBalanceResponse = {
  tokenBalance: IndexerTokenBalance;
};

function indexerHeaders(): Record<string, string> {
  return {
    "x-api-key": process.env.WDK_INDEXER_API_KEY!,
    "Content-Type": "application/json",
  };
}

export async function getUsdtBalance(walletAddress: string): Promise<string> {
  try {
    const url = `${INDEXER_BASE_URL}/api/v1/${BLOCKCHAIN}/${TOKEN}/${walletAddress}/token-balances`;
    const res = await fetch(url, { headers: indexerHeaders() });

    if (!res.ok) {
      throw new Error(`Indexer balance request failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as IndexerBalanceResponse;
    return data.tokenBalance.amount;
  } catch (error) {
    throw new Error(
      `getUsdtBalance failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getTransaction(txHash: string): Promise<IndexerTransfer | null> {
  try {
    // The Indexer doesn't expose a single-tx endpoint — fetch recent transfers
    // and find the matching hash. This is a best-effort lookup.
    const url = `${INDEXER_BASE_URL}/api/v1/${BLOCKCHAIN}/${TOKEN}/${txHash}/token-transfers`;
    const res = await fetch(url, { headers: indexerHeaders() });

    if (!res.ok) {
      throw new Error(`Indexer tx request failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as IndexerTransfersResponse;
    return data.transfers.find((t) => t.transactionHash === txHash) ?? null;
  } catch (error) {
    throw new Error(
      `getTransaction failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function pollForPayment(
  walletAddress: string,
  expectedAmountUsdt: string,
  afterTimestamp: number
): Promise<{ txHash: string } | null> {
  const expectedAmount = parseFloat(expectedAmountUsdt);
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      const url = `${INDEXER_BASE_URL}/api/v1/${BLOCKCHAIN}/${TOKEN}/${walletAddress}/token-transfers?fromTs=${afterTimestamp}&sort=desc&limit=20`;
      const res = await fetch(url, { headers: indexerHeaders() });

      if (res.ok) {
        const data = (await res.json()) as IndexerTransfersResponse;

        for (const transfer of data.transfers) {
          const receivedAmount = parseFloat(transfer.amount);
          if (
            transfer.to.toLowerCase() === walletAddress.toLowerCase() &&
            receivedAmount >= expectedAmount
          ) {
            return { txHash: transfer.transactionHash };
          }
        }
      }
      // Transient failures must not crash the loop — we just continue polling
    } catch {
      // Swallow and retry
    }

    await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return null;
}
