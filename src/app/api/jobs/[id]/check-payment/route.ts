import { NextRequest, NextResponse } from "next/server";
import { getJobById } from "@/lib/db/jobs";
import { getUserByWallet } from "@/lib/db/users";
import { getCurrentSession } from "@/lib/session";
import { pollForPayment } from "@/lib/indexer";
import { prisma } from "@/lib/prisma";
import { JobStatus, TransactionType } from "@/generated/prisma/enums";
import type { ApiError, ApiSuccess } from "@/types/index";

type CheckPaymentResponse = {
  confirmed: boolean;
  status: JobStatus;
  txHash?: string;
};

const ALREADY_PAID_STATUSES = new Set<JobStatus>([
  JobStatus.PAID,
  JobStatus.IN_PROGRESS,
  JobStatus.DELIVERED,
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<CheckPaymentResponse> | ApiError>> {
  const sessionWallet = await getCurrentSession();
  if (!sessionWallet) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionUser = await getUserByWallet(sessionWallet);
  if (!sessionUser) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Optional txHash from wagmi-confirmed transaction
  let bodyTxHash: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.txHash === "string" && body.txHash.length > 0) {
      bodyTxHash = body.txHash;
    }
  } catch {
    // no body — fine
  }

  console.log("[check-payment] checking job:", id);
  try {
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json<ApiError>({ error: "Job not found" }, { status: 404 });
    }
    console.log("[check-payment] job status:", job.status);

    if (job.clientId !== sessionUser.id) {
      return NextResponse.json<ApiError>({ error: "Forbidden" }, { status: 403 });
    }

    if (ALREADY_PAID_STATUSES.has(job.status) || job.status === JobStatus.FAILED) {
      console.log("[check-payment] already confirmed, status:", job.status);
      return NextResponse.json<ApiSuccess<CheckPaymentResponse>>({
        data: {
          confirmed: job.status !== JobStatus.PENDING,
          status: job.status,
          ...(job.txHash ? { txHash: job.txHash } : {}),
        },
      });
    }

    // If wagmi-confirmed txHash provided, trust on-chain confirmation and mark paid immediately
    if (bodyTxHash) {
      console.log("[check-payment] verifying txHash:", bodyTxHash);
      const priceUsdt = job.priceUsdt.toString();
      await prisma.$transaction([
        prisma.job.update({
          where: { id },
          data: { status: JobStatus.PAID, txHash: bodyTxHash },
        }),
        prisma.agentTransaction.create({
          data: {
            agentId: job.agentId,
            type: TransactionType.EARNED,
            amountUsdt: priceUsdt,
            txHash: bodyTxHash,
            description: `Task completed — ${job.taskDescription.slice(0, 40)}${job.taskDescription.length > 40 ? "…" : ""}`,
          },
        }),
        prisma.agent.update({
          where: { id: job.agentId },
          data: { totalEarned: { increment: priceUsdt } },
        }),
      ]);
      console.log("[check-payment] payment confirmed, job set to PAID");

      return NextResponse.json<ApiSuccess<CheckPaymentResponse>>({
        data: { confirmed: true, status: JobStatus.PAID, txHash: bodyTxHash },
      });
    }

    // status is PENDING — poll indexer for incoming transfer
    console.log("[check-payment] polling indexer...");
    const afterTimestamp = Math.floor(job.createdAt.getTime() / 1000);
    const priceUsdt = job.priceUsdt.toString();
    const result = await pollForPayment(job.agent.walletAddress, priceUsdt, afterTimestamp);
    console.log("[check-payment] result:", result !== null);

    if (!result) {
      console.log("[check-payment] payment not yet confirmed");
      return NextResponse.json<ApiSuccess<CheckPaymentResponse>>({
        data: { confirmed: false, status: JobStatus.PENDING },
      });
    }

    const { txHash } = result;

    await prisma.$transaction([
      prisma.job.update({
        where: { id },
        data: { status: JobStatus.PAID, txHash },
      }),
      prisma.agentTransaction.create({
        data: {
          agentId: job.agentId,
          type: TransactionType.EARNED,
          amountUsdt: priceUsdt,
          txHash,
          description: `Payment received for job ${id}`,
        },
      }),
      prisma.agent.update({
        where: { id: job.agentId },
        data: { totalEarned: { increment: priceUsdt } },
      }),
    ]);
    console.log("[check-payment] payment confirmed, job set to PAID");

    return NextResponse.json<ApiSuccess<CheckPaymentResponse>>({
      data: { confirmed: true, status: JobStatus.PAID, txHash },
    });
  } catch (error) {
    console.error("[check-payment] error:", error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
