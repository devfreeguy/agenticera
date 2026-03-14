import { NextRequest, NextResponse } from "next/server";
import { getAgentById } from "@/lib/db/agents";
import { createJob, getJobsByClient } from "@/lib/db/jobs";
import { getUserByWallet } from "@/lib/db/users";
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
  req: NextRequest
): Promise<NextResponse<ApiSuccess<CreateJobResponse> | ApiError>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiError>({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { clientId, agentId, taskDescription } = parsed.data;

  try {
    const agent = await getAgentById(agentId);
    if (!agent) {
      return NextResponse.json<ApiError>({ error: "Agent not found" }, { status: 404 });
    }
    if (agent.status !== AgentStatus.ACTIVE) {
      return NextResponse.json<ApiError>({ error: "Agent is not active" }, { status: 404 });
    }

    const job = await createJob({
      clientId,
      agentId,
      taskDescription,
      priceUsdt: agent.pricePerTask.toString(),
    });

    return NextResponse.json<ApiSuccess<CreateJobResponse>>({
      data: {
        ...job,
        priceUsdt: job.priceUsdt.toString(),
        agentWalletAddress: agent.walletAddress,
      },
    });
  } catch (error) {
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiSuccess<JobWithRelations[]> | ApiError>> {
  const walletAddress = req.nextUrl.searchParams.get("walletAddress");
  if (!walletAddress) {
    return NextResponse.json<ApiError>({ error: "walletAddress query param is required" }, { status: 400 });
  }

  try {
    const user = await getUserByWallet(walletAddress);
    if (!user) {
      return NextResponse.json<ApiError>({ error: "User not found" }, { status: 404 });
    }

    const jobs = await getJobsByClient(user.id);
    return NextResponse.json<ApiSuccess<JobWithRelations[]>>({
      data: jobs.map(serializeJob),
    });
  } catch (error) {
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
