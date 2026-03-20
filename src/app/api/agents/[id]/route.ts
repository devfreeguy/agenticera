import { NextRequest, NextResponse } from "next/server";
import { getAgentById, updateAgentSettings } from "@/lib/db/agents";
import { getUserByWallet } from "@/lib/db/users";
import { updateAgentSettingsSchema } from "@/lib/validations/agentSchema";
import { AgentStatus } from "@/generated/prisma/enums";
import { serializeAgent } from "@/utils/serialize";
import { getCurrentSession } from "@/lib/session";
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
    console.error(`[GET /api/agents/${id}] Failed to fetch agent:`, error instanceof Error ? error.message : error);
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

  const parsed = updateAgentSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: parsed.error.issues[0]?.message ?? "Invalid fields" },
      { status: 400 }
    );
  }

  const sessionWallet = await getCurrentSession();
  if (!sessionWallet) {
    return NextResponse.json<ApiError>({ error: "Unauthorized. Please connect your wallet." }, { status: 401 });
  }

  try {
    const sessionUser = await getUserByWallet(sessionWallet);
    if (!sessionUser) {
      return NextResponse.json<ApiError>({ error: "Session user not found" }, { status: 401 });
    }

    const existingAgent = await getAgentById(id);
    if (!existingAgent) {
      return NextResponse.json<ApiError>({ error: "Agent not found" }, { status: 404 });
    }
    
    if (existingAgent.ownerId !== sessionUser.id) {
      return NextResponse.json<ApiError>({ error: "Forbidden. You do not own this agent." }, { status: 403 });
    }

    const updates: { status?: AgentStatus; systemPrompt?: string; pricePerTask?: string } = {};
    if (parsed.data.status) updates.status = parsed.data.status as AgentStatus;
    if (parsed.data.systemPrompt) updates.systemPrompt = parsed.data.systemPrompt;
    if (parsed.data.pricePerTask !== undefined)
      updates.pricePerTask = parsed.data.pricePerTask.toString();

    const agent = await updateAgentSettings(id, updates);
    return NextResponse.json<ApiSuccess<AgentPublic>>({ data: serializeAgent(agent) });
  } catch (error) {
    console.error(`[PATCH /api/agents/${id}] Failed to update agent:`, error instanceof Error ? error.message : error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
