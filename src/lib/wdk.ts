import { prisma } from "@/lib/prisma";

const WDK_SERVICE_URL = process.env.WDK_SERVICE_URL ?? "http://localhost:3001";

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
    cache: "no-store",
    headers: { ...wdkHeaders(), ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json() as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // fall through to statusText
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ─── Wallet creation ──────────────────────────────────────────────────────────

export async function createAgentWallet(): Promise<{
  address: string;
  encryptedSeed: string;
}> {
  console.log("[wdk] createAgentWallet called");
  try {
    return await wdkFetch<{ address: string; encryptedSeed: string }>("/wallet/create", {
      method: "POST",
    });
  } catch (error) {
    console.error("[wdk] error:", error);
    throw new Error(
      `createAgentWallet failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ─── Balance ──────────────────────────────────────────────────────────────────

export async function getAgentBalance(walletAddress: string): Promise<string> {
  console.log("[wdk] getAgentBalance for:", walletAddress);
  try {
    const data = await wdkFetch<{ balance: string; address: string }>(
      `/wallet/balance/${walletAddress}`
    );
    return data.balance;
  } catch (err) {
    console.error(`[wdk] Critical failure connecting to wallet service layer for balance check (address: ${walletAddress}):`, err instanceof Error ? err.message : String(err));
    console.warn("[wdk] Gracefully falling back to 0.00 balance to preserve UI.");
    return "0.00";
  }
}

// ─── Send USDT ────────────────────────────────────────────────────────────────

export async function sendUsdt(
  fromAgentId: string,
  toAddress: string,
  amountUsdt: string
): Promise<{ txHash: string }> {
  console.log("[wdk] sendUsdt from agent:", fromAgentId, "to:", toAddress, "amount:", amountUsdt);
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
}

// ─── Payment verification ─────────────────────────────────────────────────────

export async function verifyPayment(
  walletAddress: string,
  expectedAmountUsdt: string,
  afterTimestamp: number
): Promise<{ confirmed: boolean; txHash?: string }> {
  console.log("[wdk] verifyPayment for:", walletAddress);
  try {
    const result = await wdkFetch<{ confirmed: boolean; txHash?: string }>("/wallet/verify-payment", {
      method: "POST",
      body: JSON.stringify({ walletAddress, expectedAmountUsdt, afterTimestamp }),
    });
    console.log("[wdk] verifyPayment result:", result.confirmed);
    return result;
  } catch (error) {
    console.error("[wdk] error:", error);
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
