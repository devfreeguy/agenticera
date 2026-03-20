import { NextRequest, NextResponse } from "next/server";
import { getAgentById } from "@/lib/db/agents";
import { getAgentBalance } from "@/lib/wdk";
import type { ApiError, ApiSuccess } from "@/types/index";

type BalanceResponse = { balance: string; walletAddress: string };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<BalanceResponse> | ApiError>> {
  const { id } = await params;
  console.log("[api:balance] checking balance for agent id:", id);

  try {
    const agent = await getAgentById(id);
    if (!agent) {
      console.warn("[api:balance] agent not found in DB:", id);
      return NextResponse.json<ApiError>({ error: "Agent not found" }, { status: 488 });
    }
    console.log("[api:balance] agent found, wallet:", agent.walletAddress);

    const balance = await getAgentBalance(agent.walletAddress);
    return NextResponse.json<ApiSuccess<BalanceResponse>>({
      data: { balance, walletAddress: agent.walletAddress },
    });
  } catch (error) {
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
