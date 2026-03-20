import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { upsertUser } from "@/lib/db/users";
import { setSessionCookie, consumeNonce } from "@/lib/session";
import type { ApiError, ApiSuccess, WalletUser } from "@/types/index";
import { BRAND_NAME } from "@/constants/brand";

export async function POST(req: NextRequest): Promise<NextResponse<ApiSuccess<WalletUser> | ApiError>> {
  let body: { walletAddress?: string; signature?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiError>({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { walletAddress, signature } = body;

  if (!walletAddress || !signature) {
    return NextResponse.json<ApiError>(
      { error: "walletAddress and signature are required" },
      { status: 400 }
    );
  }

  // Consume the server-side nonce (one-time use)
  const nonce = await consumeNonce();
  if (!nonce) {
    return NextResponse.json<ApiError>(
      { error: "Missing or expired nonce. Please request a new one." },
      { status: 400 }
    );
  }

  // Build the SIWE message the frontend signed
  const message = `${BRAND_NAME} wants you to sign in with your Ethereum account:\n${walletAddress}\n\nNonce: ${nonce}`;

  // Verify the signature
  let isValid = false;
  try {
    isValid = await verifyMessage({
      address: walletAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    return NextResponse.json<ApiError>({ error: "Signature verification failed." }, { status: 401 });
  }

  if (!isValid) {
    return NextResponse.json<ApiError>({ error: "Invalid signature." }, { status: 401 });
  }

  try {
    const user = await upsertUser(walletAddress);
    await setSessionCookie(user.walletAddress);
    return NextResponse.json<ApiSuccess<WalletUser>>({ data: user });
  } catch (error) {
    console.error("[POST /api/auth/connect] Failed to upsert user or set session:", error instanceof Error ? error.message : error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

