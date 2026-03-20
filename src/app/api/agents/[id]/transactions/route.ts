import { getTransactionsByAgent } from "@/lib/db/transactions";
import type { ApiError, ApiSuccess } from "@/types/index";
import {
  serializeTransaction,
  type SerializedTransaction,
} from "@/utils/serialize";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiSuccess<SerializedTransaction[]> | ApiError>> {
  const { id } = await params;

  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  if (isNaN(limit) || limit < 1) {
    return NextResponse.json<ApiError>(
      { error: "limit must be a positive integer" },
      { status: 400 },
    );
  }

  try {
    const transactions = await getTransactionsByAgent(id, limit);
    return NextResponse.json<ApiSuccess<SerializedTransaction[]>>({
      data: transactions.map(serializeTransaction),
    });
  } catch (error) {
    console.error(
      `[GET /api/agents/${id}/transactions] Failed to fetch transactions:`,
      error,
    );
    return NextResponse.json<ApiError>(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
