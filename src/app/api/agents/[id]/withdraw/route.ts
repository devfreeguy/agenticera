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

    // Check balance — handle network failures separately
    let balance: string;
    try {
      balance = await getAgentBalance(agent.walletAddress);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const isNetwork = msg.includes("fetch failed") || msg.includes("ECONNREFUSED") || msg.includes("network");
      return NextResponse.json<ApiError>(
        {
          error: isNetwork
            ? "Could not verify balance. The Base network may be temporarily unreachable. Please try again."
            : msg || "Balance check failed.",
        },
        { status: 502 }
      );
    }

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
    console.error("[withdraw] error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";

    if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED")) {
      return NextResponse.json<ApiError>(
        { error: "Payment service is unreachable. Please try again later." },
        { status: 502 }
      );
    }

    // User-actionable errors → 400; system errors → 500
    const isUserError =
      msg.startsWith("Insufficient") ||
      msg.startsWith("Transaction rejected") ||
      msg.startsWith("Could not reach") ||
      msg.startsWith("Base network");

    return NextResponse.json<ApiError>({ error: msg }, { status: isUserError ? 400 : 500 });
  }
}
