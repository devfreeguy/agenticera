import { NextRequest, NextResponse } from "next/server";
import { upsertUser } from "@/lib/db/users";
import { connectSchema } from "@/lib/validations/userSchema";
import type { ApiError, ApiSuccess, WalletUser } from "@/types/index";

export async function POST(req: NextRequest): Promise<NextResponse<ApiSuccess<WalletUser> | ApiError>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiError>({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  try {
    const user = await upsertUser(parsed.data.walletAddress);
    return NextResponse.json<ApiSuccess<WalletUser>>({ data: user });
  } catch (error) {
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
