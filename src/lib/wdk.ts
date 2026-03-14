import { prisma } from "@/lib/prisma";

const WDK_SERVICE_URL = "http://localhost:3001";

function wdkHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-wdk-service-secret": process.env.WDK_SERVICE_SECRET!,
  };
}

async function wdkFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${WDK_SERVICE_URL}${path}`, {
    ...options,
    headers: { ...wdkHeaders(), ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`WDK service error (${res.status}): ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── Wallet creation ──────────────────────────────────────────────────────────

export async function createAgentWallet(): Promise<{
  address: string;
  encryptedSeed: string;
}> {
  try {
    return await wdkFetch<{ address: string; encryptedSeed: string }>("/wallet/create", {
      method: "POST",
    });
  } catch (error) {
    throw new Error(
      `createAgentWallet failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ─── Balance ──────────────────────────────────────────────────────────────────

export async function getAgentBalance(walletAddress: string): Promise<string> {
  try {
    const data = await wdkFetch<{ balance: string; address: string }>(
      `/wallet/balance/${walletAddress}`
    );
    return data.balance;
  } catch (error) {
    throw new Error(
      `getAgentBalance failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ─── Send USDT ────────────────────────────────────────────────────────────────

export async function sendUsdt(
  fromAgentId: string,
  toAddress: string,
  amountUsdt: string
): Promise<{ txHash: string }> {
  try {
    const agent = await prisma.agent.findUniqueOrThrow({
      where: { id: fromAgentId },
      select: { encryptedSeedPhrase: true },
    });

    return await wdkFetch<{ txHash: string }>("/wallet/send", {
      method: "POST",
      body: JSON.stringify({
        fromEncryptedSeed: agent.encryptedSeedPhrase,
        toAddress,
        amountUsdt,
      }),
    });
  } catch (error) {
    throw new Error(
      `sendUsdt failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ─── Payment verification ─────────────────────────────────────────────────────

export async function verifyPayment(
  walletAddress: string,
  expectedAmountUsdt: string,
  afterTimestamp: number
): Promise<{ confirmed: boolean; txHash?: string }> {
  try {
    return await wdkFetch<{ confirmed: boolean; txHash?: string }>("/wallet/verify-payment", {
      method: "POST",
      body: JSON.stringify({ walletAddress, expectedAmountUsdt, afterTimestamp }),
    });
  } catch (error) {
    throw new Error(
      `verifyPayment failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ─── Seed decryption (proxied to wdk-service) ─────────────────────────────────

export async function decryptAgentSeed(encryptedSeed: string): Promise<string> {
  try {
    const data = await wdkFetch<{ seedPhrase: string }>("/wallet/decrypt", {
      method: "POST",
      body: JSON.stringify({ encryptedSeed }),
    });
    return data.seedPhrase;
  } catch (error) {
    throw new Error(
      `decryptAgentSeed failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
