import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";

const userSelect = {
  id: true,
  walletAddress: true,
  role: true,
  onboarded: true,
  createdAt: true,
} as const;

export async function getUserByWallet(walletAddress: string) {
  try {
    return await prisma.user.findUnique({
      where: { walletAddress },
      select: userSelect,
    });
  } catch (error) {
    throw new Error(
      `getUserByWallet failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function createUser(walletAddress: string) {
  try {
    return await prisma.user.create({
      data: { walletAddress },
      select: userSelect,
    });
  } catch (error) {
    throw new Error(
      `createUser failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function upsertUser(walletAddress: string) {
  try {
    return await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress },
      select: userSelect,
    });
  } catch (error) {
    throw new Error(
      `upsertUser failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function updateUserRole(id: string, role: Role) {
  try {
    return await prisma.user.update({
      where: { id },
      data: { role },
      select: userSelect,
    });
  } catch (error) {
    throw new Error(
      `updateUserRole failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function markUserOnboarded(id: string) {
  try {
    return await prisma.user.update({
      where: { id },
      data: { onboarded: true },
      select: userSelect,
    });
  } catch (error) {
    throw new Error(
      `markUserOnboarded failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
