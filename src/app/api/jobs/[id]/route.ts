import { NextRequest, NextResponse } from "next/server";
import { getJobById } from "@/lib/db/jobs";
import { serializeJob } from "@/utils/serialize";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@/generated/prisma/enums";
import type { ApiError, ApiSuccess, JobWithRelations } from "@/types/index";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<JobWithRelations> | ApiError>> {
  const { id } = await params;

  console.log("[job:get] fetching job:", id);
  try {
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json<ApiError>({ error: "Job not found" }, { status: 404 });
    }
    console.log("[job:get] job found, status:", job.status);
    return NextResponse.json<ApiSuccess<JobWithRelations>>({
      data: serializeJob(job),
    });
  } catch (error) {
    console.error("[job:get] error:", error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<JobWithRelations> | ApiError>> {
  const { id } = await params;

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiError>({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.status !== "PAID") {
    return NextResponse.json<ApiError>({ error: "Only PAID status reset is supported" }, { status: 400 });
  }

  try {
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json<ApiError>({ error: "Job not found" }, { status: 404 });
    }
    if (job.status !== JobStatus.FAILED) {
      return NextResponse.json<ApiError>({ error: "Job is not in FAILED state" }, { status: 400 });
    }
    await prisma.job.update({ where: { id }, data: { status: JobStatus.PAID } });
    const updated = await getJobById(id);
    return NextResponse.json<ApiSuccess<JobWithRelations>>({ data: serializeJob(updated!) });
  } catch (error) {
    console.error(`[PATCH /api/jobs/${id}] Failed to update job status:`, error instanceof Error ? error.message : error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
