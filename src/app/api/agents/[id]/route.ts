import { NextRequest, NextResponse } from "next/server";
import { getAgentById, updateAgentStatus } from "@/lib/db/agents";
import { updateAgentStatusSchema } from "@/lib/validations/agentSchema";
import { AgentStatus } from "@/generated/prisma/enums";
import { serializeAgent } from "@/utils/serialize";
import type { AgentPublic, ApiError, ApiSuccess } from "@/types/index";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<AgentPublic> | ApiError>> {
  const { id } = await params;

  try {
    const agent = await getAgentById(id);
    if (!agent) {
      return NextResponse.json<ApiError>({ error: "Agent not found" }, { status: 404 });
    }
    return NextResponse.json<ApiSuccess<AgentPublic>>({ data: serializeAgent(agent) });
  } catch (error) {
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<AgentPublic> | ApiError>> {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiError>({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateAgentStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: parsed.error.issues[0]?.message ?? "Invalid status" },
      { status: 400 }
    );
  }

  try {
    const agent = await updateAgentStatus(id, parsed.data.status as AgentStatus);
    return NextResponse.json<ApiSuccess<AgentPublic>>({ data: serializeAgent(agent) });
  } catch (error) {
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
