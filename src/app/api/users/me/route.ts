import { NextRequest, NextResponse } from "next/server";
import { getUserByWallet, updateUserRole } from "@/lib/db/users";
import { connectSchema, updateRoleSchema } from "@/lib/validations/userSchema";
import { getCurrentSession } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import type { ApiError, ApiSuccess, WalletUser } from "@/types/index";

export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiSuccess<WalletUser> | ApiError>> {
  const walletAddress = req.nextUrl.searchParams.get("walletAddress");

  // Validate session before returning any user data
  const sessionWallet = await getCurrentSession();
  if (!sessionWallet) {
    return NextResponse.json<ApiError>(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }
  if (
    walletAddress &&
    sessionWallet.toLowerCase() !== walletAddress.toLowerCase()
  ) {
    return NextResponse.json<ApiError>({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = connectSchema.safeParse({
    walletAddress: walletAddress ?? sessionWallet,
  });
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: parsed.error.issues[0]?.message ?? "Invalid walletAddress" },
      { status: 400 },
    );
  }

  try {
    const user = await getUserByWallet(parsed.data.walletAddress);
    if (!user) {
      return NextResponse.json<ApiError>(
        { error: "User not found" },
        { status: 404 },
      );
    }
    return NextResponse.json<ApiSuccess<WalletUser>>({ data: user });
  } catch (error) {
    console.error("[GET /api/users/me] Failed to fetch user:", parsed.data.walletAddress, error instanceof Error ? error.message : error);
    return NextResponse.json<ApiError>(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
): Promise<NextResponse<ApiSuccess<WalletUser> | ApiError>> {
  const walletAddress = req.nextUrl.searchParams.get("walletAddress");
  const sessionWallet = await getCurrentSession();
  
  if (!sessionWallet) {
    return NextResponse.json<ApiError>(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (
    walletAddress &&
    sessionWallet.toLowerCase() !== walletAddress.toLowerCase()
  ) {
    return NextResponse.json<ApiError>({ error: "Forbidden" }, { status: 403 });
  }


  const addressParsed = connectSchema.safeParse({ walletAddress });
  if (!addressParsed.success) {
    return NextResponse.json<ApiError>(
      {
        error:
          addressParsed.error.issues[0]?.message ?? "Invalid walletAddress",
      },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const roleParsed = updateRoleSchema.safeParse(body);
  if (!roleParsed.success) {
    return NextResponse.json<ApiError>(
      { error: roleParsed.error.issues[0]?.message ?? "Invalid role" },
      { status: 400 },
    );
  }

  try {
    const existingUser = await getUserByWallet(
      addressParsed.data.walletAddress,
    );
    if (!existingUser) {
      return NextResponse.json<ApiError>(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const updatedUser = await updateUserRole(
      existingUser.id,
      roleParsed.data.role as Role,
    );
    return NextResponse.json<ApiSuccess<WalletUser>>({ data: updatedUser });
  } catch (error) {
    console.error("[PATCH /api/users/me] Failed to update user role:", addressParsed.data.walletAddress, error instanceof Error ? error.message : error);
    return NextResponse.json<ApiError>(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
