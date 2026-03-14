import { NextRequest, NextResponse } from "next/server";
import { getJobById } from "@/lib/db/jobs";
import { serializeJob } from "@/utils/serialize";
import type { ApiError, ApiSuccess, JobWithRelations } from "@/types/index";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<JobWithRelations> | ApiError>> {
  const { id } = await params;

  try {
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json<ApiError>({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json<ApiSuccess<JobWithRelations>>({
      data: serializeJob(job),
    });
  } catch (error) {
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
