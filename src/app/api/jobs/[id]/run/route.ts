import { NextRequest, NextResponse } from "next/server";
import { getJobById } from "@/lib/db/jobs";
import { executeJob } from "@/lib/agent-runtime";
import { JobStatus } from "@/generated/prisma/enums";
import type { ApiError, ApiSuccess } from "@/types/index";

type RunJobResponse = {
  status: "DELIVERED";
  output: string;
};

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<RunJobResponse> | ApiError>> {
  const { id } = await params;

  let job: Awaited<ReturnType<typeof getJobById>>;
  try {
    job = await getJobById(id);
  } catch (error) {
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }

  if (!job) {
    return NextResponse.json<ApiError>({ error: "Job not found" }, { status: 404 });
  }

  // Idempotency
  if (job.status === JobStatus.DELIVERED && job.output) {
    return NextResponse.json<ApiSuccess<RunJobResponse>>({
      data: { status: "DELIVERED", output: job.output },
    });
  }
  if (job.status === JobStatus.IN_PROGRESS || job.status === JobStatus.FAILED) {
    return NextResponse.json<ApiError>(
      { error: `Job is already in status: ${job.status}` },
      { status: 400 }
    );
  }
  if (job.status !== JobStatus.PAID) {
    return NextResponse.json<ApiError>({ error: "Payment not confirmed" }, { status: 400 });
  }

  const result = await executeJob(id);

  if (result.status === "FAILED") {
    return NextResponse.json<ApiError>({ error: "Job execution failed" }, { status: 500 });
  }

  return NextResponse.json<ApiSuccess<RunJobResponse>>({
    data: { status: "DELIVERED", output: result.output },
  });
}
