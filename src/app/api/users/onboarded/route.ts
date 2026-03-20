import { NextRequest, NextResponse } from "next/server";
import { getUserByWallet, markUserOnboarded } from "@/lib/db/users";
import type { ApiError, ApiSuccess, WalletUser } from "@/types/index";

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiSuccess<WalletUser> | ApiError>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiError>({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { walletAddress } = body as { walletAddress?: string };
  if (!walletAddress) {
    return NextResponse.json<ApiError>({ error: "walletAddress is required" }, { status: 400 });
  }

  try {
    const user = await getUserByWallet(walletAddress);
    if (!user) {
      return NextResponse.json<ApiError>({ error: "User not found" }, { status: 404 });
    }
    const updated = await markUserOnboarded(user.id);
    return NextResponse.json<ApiSuccess<WalletUser>>({ data: updated });
  } catch (error) {
    console.error("[POST /api/users/onboarded] Failed to mark user onboarded:", walletAddress, error instanceof Error ? error.message : error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
