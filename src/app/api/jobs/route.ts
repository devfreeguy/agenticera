import { NextRequest, NextResponse } from "next/server";
import { getAgentById } from "@/lib/db/agents";
import { createJob, getJobsByClient } from "@/lib/db/jobs";
import { getUserByWallet } from "@/lib/db/users";
import { getCurrentSession } from "@/lib/session";
import { createJobSchema } from "@/lib/validations/jobSchema";
import { AgentStatus } from "@/generated/prisma/enums";
import { serializeJob } from "@/utils/serialize";
import type { ApiError, ApiSuccess, JobWithRelations } from "@/types/index";

type CreateJobResponse = {
  id: string;
  clientId: string;
  agentId: string;
  taskDescription: string;
  priceUsdt: string;
  status: string;
  output: string | null;
  txHash: string | null;
  createdAt: Date;
  updatedAt: Date;
  agentWalletAddress: string;
};

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiSuccess<CreateJobResponse> | ApiError>> {
  const sessionWallet = await getCurrentSession();
  if (!sessionWallet) {
    return NextResponse.json<ApiError>(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const sessionUser = await getUserByWallet(sessionWallet);
  if (!sessionUser) {
    return NextResponse.json<ApiError>(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const { agentId, taskDescription } = parsed.data;
  console.log("[jobs:create] creating job for agent:", agentId);

  try {
    const agent = await getAgentById(agentId);
    if (!agent) {
      return NextResponse.json<ApiError>(
        { error: "Agent not found" },
        { status: 404 },
      );
    }
    if (agent.status !== AgentStatus.ACTIVE) {
      return NextResponse.json<ApiError>(
        { error: "Agent is not active" },
        { status: 404 },
      );
    }
    console.log(
      "[jobs:create] agent found, price:",
      agent.pricePerTask.toString(),
    );

    const job = await createJob({
      clientId: sessionUser.id,
      agentId,
      taskDescription,
      priceUsdt: agent.pricePerTask.toString(),
    });
    console.log("[jobs:create] job created:", job.id);

    return NextResponse.json<ApiSuccess<CreateJobResponse>>({
      data: {
        ...job,
        priceUsdt: job.priceUsdt.toString(),
        agentWalletAddress: agent.walletAddress,
      },
    });
  } catch (error) {
    console.error("[jobs:create] error:", error);
    return NextResponse.json<ApiError>(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiSuccess<JobWithRelations[]> | ApiError>> {
  const sessionWallet = await getCurrentSession();
  if (!sessionWallet) {
    return NextResponse.json<ApiError>(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const user = await getUserByWallet(sessionWallet);
    if (!user) {
      return NextResponse.json<ApiError>(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const jobs = await getJobsByClient(user.id);
    return NextResponse.json<ApiSuccess<JobWithRelations[]>>({
      data: jobs.map(serializeJob),
    });
  } catch (error) {
    console.error("[GET /api/jobs] Failed to fetch jobs for session wallet:", sessionWallet, error instanceof Error ? error.message : error);
    return NextResponse.json<ApiError>(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
