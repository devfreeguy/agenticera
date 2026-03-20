import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { getUserByWallet } from "@/lib/db/users";
import { JobStatus } from "@/generated/prisma/enums";
import { serializeTransaction, type SerializedTransaction } from "@/utils/serialize";
import type { ApiError, ApiSuccess } from "@/types/index";

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiSuccess<SerializedTransaction[]> | ApiError>> {
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 100;

  if (isNaN(limit) || limit < 1) {
    return NextResponse.json<ApiError>({ error: "limit must be a positive integer" }, { status: 400 });
  }

  const sessionWallet = await getCurrentSession();
  if (!sessionWallet) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await getUserByWallet(sessionWallet);
    if (!user) {
      return NextResponse.json<ApiError>({ error: "User not found" }, { status: 404 });
    }

    // 1. Get all AgentTransactions for agents owned by this user
    const agentTxnsLogs = await prisma.agentTransaction.findMany({
      where: {
        agent: {
          ownerId: user.id
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        agentId: true,
        type: true,
        amountUsdt: true,
        txHash: true,
        description: true,
        createdAt: true,
      }
    });

    const standardTxns = agentTxnsLogs.map(serializeTransaction);

    // 2. Get all Jobs the user PAID FOR as a client to map to SPENT transactions
    const clientJobs = await prisma.job.findMany({
      where: {
        clientId: user.id,
        status: { in: [JobStatus.DELIVERED, JobStatus.FAILED] }, // assuming they paid to start it
        txHash: { not: null }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        agentId: true,
        priceUsdt: true,
        txHash: true,
        taskDescription: true,
        createdAt: true,
      }
    });

    const clientTxns: SerializedTransaction[] = clientJobs.map(job => ({
      id: `client-spend-${job.id}`,
      agentId: job.agentId,
      type: "SPENT",
      amountUsdt: job.priceUsdt.toString(),
      description: `Payment for Job: ${job.taskDescription.slice(0, 30)}...`,
      txHash: job.txHash,
      createdAt: job.createdAt
    }));

    // Merge and sort
    const allTxns = [...standardTxns, ...clientTxns]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return NextResponse.json<ApiSuccess<SerializedTransaction[]>>({
      data: allTxns,
    });
  } catch (error) {
    console.error("[GET /api/transactions] Failed to fetch transactions for wallet:", sessionWallet, error instanceof Error ? error.message : error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
