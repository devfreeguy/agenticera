import { NextRequest, NextResponse } from "next/server";
import { createAgentWallet } from "@/lib/wdk";
import { createAgent, getActiveAgents } from "@/lib/db/agents";
import { createAgentSchema } from "@/lib/validations/agentSchema";
import { serializeAgent } from "@/utils/serialize";
import type { AgentPublic, ApiError, ApiSuccess } from "@/types/index";

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiSuccess<AgentPublic> | ApiError>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = createAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  try {
    const { address, encryptedSeed } = await createAgentWallet();
    const agent = await createAgent({
      ownerId: parsed.data.ownerId,
      name: parsed.data.name,
      systemPrompt: parsed.data.systemPrompt,
      pricePerTask: String(parsed.data.pricePerTask),
      categoryIds: parsed.data.categories,
      walletAddress: address,
      encryptedSeedPhrase: encryptedSeed,
    });
    return NextResponse.json<ApiSuccess<AgentPublic>>({
      data: serializeAgent(agent),
    });
  } catch (error) {
    console.error("[POST /api/agents] Failed to create agent:", error instanceof Error ? error.message : error);
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
): Promise<NextResponse<ApiSuccess<AgentPublic[]> | ApiError>> {
  const category = req.nextUrl.searchParams.get("category") ?? undefined;

  try {
    const agents = await getActiveAgents(category ? { category } : undefined);
    return NextResponse.json<ApiSuccess<AgentPublic[]>>({
      data: agents.map(serializeAgent),
    });
  } catch (error) {
    console.error("[GET /api/agents] Failed to fetch agents:", error instanceof Error ? error.message : error);
    return NextResponse.json<ApiError>(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
