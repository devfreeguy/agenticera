import { NextRequest, NextResponse } from "next/server";
import { getAgentById } from "@/lib/db/agents";
import { getAgentBalance, sendUsdt } from "@/lib/wdk";
import { createTransaction } from "@/lib/db/transactions";
import { withdrawSchema } from "@/lib/validations/agentSchema";
import { TransactionType } from "@/generated/prisma/enums";
import type { ApiError, ApiSuccess } from "@/types/index";

type WithdrawResponse = { txHash: string };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<WithdrawResponse> | ApiError>> {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiError>({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = withdrawSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { toAddress, amountUsdt } = parsed.data;

  try {
    const agent = await getAgentById(id);
    if (!agent) {
      return NextResponse.json<ApiError>({ error: "Agent not found" }, { status: 404 });
    }

    const balance = await getAgentBalance(agent.walletAddress);
    if (parseFloat(balance) < parseFloat(amountUsdt)) {
      return NextResponse.json<ApiError>(
        {
          error: `Insufficient balance: agent has ${balance} USDT, requested ${amountUsdt} USDT`,
        },
        { status: 400 }
      );
    }

    const { txHash } = await sendUsdt(id, toAddress, amountUsdt);

    await createTransaction({
      agentId: id,
      type: TransactionType.WITHDRAWAL,
      amountUsdt,
      txHash,
      description: `Withdrawal of ${amountUsdt} USDT to ${toAddress}`,
    });

    return NextResponse.json<ApiSuccess<WithdrawResponse>>({ data: { txHash } });
  } catch (error) {
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
