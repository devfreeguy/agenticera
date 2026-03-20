import { NextRequest, NextResponse } from "next/server";
import { getUserByWallet, markUserOnboarded } from "@/lib/db/users";
import { getCurrentSession } from "@/lib/session";
import type { ApiError, ApiSuccess, WalletUser } from "@/types/index";

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiSuccess<WalletUser> | ApiError>> {
  const sessionWallet = await getCurrentSession();
  if (!sessionWallet) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiError>({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { walletAddress } = body as { walletAddress?: string };
  if (walletAddress && sessionWallet.toLowerCase() !== walletAddress.toLowerCase()) {
    return NextResponse.json<ApiError>({ error: "Forbidden" }, { status: 403 });
  }

  const effectiveWallet = walletAddress ?? sessionWallet;

  try {
    const user = await getUserByWallet(effectiveWallet);
    if (!user) {
      return NextResponse.json<ApiError>({ error: "User not found" }, { status: 404 });
    }
    const updated = await markUserOnboarded(user.id);
    return NextResponse.json<ApiSuccess<WalletUser>>({ data: updated });
  } catch (error) {
    console.error("[POST /api/users/onboarded] Failed to mark user onboarded:", effectiveWallet, error instanceof Error ? error.message : error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
