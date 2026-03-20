import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeJob } from "@/lib/agent-runtime";
import { getUserByWallet } from "@/lib/db/users";
import { getCurrentSession } from "@/lib/session";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

export async function POST(req: NextRequest) {
  const sessionWallet = await getCurrentSession();
  if (!sessionWallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionUser = await getUserByWallet(sessionWallet);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { jobId, txHash } = await req.json();

    // Verify the session user is the job's client
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { clientId: true } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (job.clientId !== sessionUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rpcUrl = process.env.BASE_RPC_URL;
    if (!rpcUrl) throw new Error("BASE_RPC_URL is missing in .env");

    // If txHash looks like a dev fake (all zeros suffix), skip on-chain read
    const isFakeTxHash = txHash?.endsWith("0".repeat(30));

    let onChainJobId: string | null = null;

    if (!isFakeTxHash) {
      // 1. Wait for the tx to be confirmed, then extract jobId from the JobCreated event log
      const client = createPublicClient({ chain: base, transport: http(rpcUrl) });
      const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "") as `0x${string}`;

      // Wait for the tx to be confirmed on-chain before reading the job ID
      const receipt = await client.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

      // Extract jobId from the JobCreated event log emitted by the escrow contract.
      // Event: JobCreated(uint256 jobId, address client, address agent, uint256 amount)
      // No params are indexed → all 4 values are ABI-encoded in log.data (32 bytes each).
      // jobId is the first 32 bytes of data.
      const jobCreatedLog = receipt.logs.find(
        (log) => log.address.toLowerCase() === contractAddress.toLowerCase()
      );

      if (jobCreatedLog?.data && jobCreatedLog.data.length >= 66) {
        const jobIdHex = jobCreatedLog.data.slice(0, 66); // "0x" + 64 hex chars = 32 bytes
        onChainJobId = BigInt(jobIdHex).toString();
      }

      if (!onChainJobId) {
        // Fallback: jobCounter is already incremented by this point since tx is confirmed
        const counter = await client.readContract({
          address: contractAddress,
          abi: [{ name: "jobCounter", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] }],
          functionName: "jobCounter",
        });
        onChainJobId = counter.toString();
      }
    } else {
      console.log("[Execute API] Dev fake txHash detected — skipping on-chain read");
    }

    // 2. Lock the payment status AND the On-Chain ID into your database
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "PAID",
        onChainJobId, // null in dev mode, real ID in production
        txHash, // Save the tx hash so it populates Client Transactions correctly
      },
    });

    // 3. Wake up the AI
    executeJob(jobId).catch((err) => {
      console.error(`[Background Execution Failed] Job ID: ${jobId}`, err);
    });

    return NextResponse.json({ success: true, message: "Agent is executing" });
  } catch (error) {
    console.error("[Execute API] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
