import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeJob } from "@/lib/agent-runtime";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

export async function POST(req: Request) {
  try {
    const { jobId, txHash } = await req.json();

    const rpcUrl = process.env.BASE_RPC_URL;
    if (!rpcUrl) throw new Error("BASE_RPC_URL is missing in .env");

    // If txHash looks like a dev fake (all zeros suffix), skip on-chain read
    const isFakeTxHash = txHash?.endsWith("0".repeat(30));

    let onChainJobId: string | null = null;

    if (!isFakeTxHash) {
      // 1. Read the latest Job ID from the Smart Contract
      const client = createPublicClient({ chain: base, transport: http(rpcUrl) });
      const contractAddress = process.env
        .NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS as `0x${string}`;

      const latestOnChainId = await client.readContract({
        address: contractAddress,
        abi: [
          {
            name: "jobCounter",
            type: "function",
            stateMutability: "view",
            inputs: [],
            outputs: [{ type: "uint256" }],
          },
        ],
        functionName: "jobCounter",
      });
      onChainJobId = latestOnChainId.toString();
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
