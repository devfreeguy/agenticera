import { prisma } from "@/lib/prisma";
import { AgentStatus } from "@/generated/prisma/enums";

// All public-safe agent fields — encryptedSeedPhrase is never included
const agentPublicSelect = {
  id: true,
  ownerId: true,
  name: true,
  systemPrompt: true,
  pricePerTask: true,
  categoryIds: true,
  walletAddress: true,
  status: true,
  totalEarned: true,
  totalSpent: true,
  rating: true,
  jobsCompleted: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function createAgent(data: {
  ownerId: string;
  name: string;
  systemPrompt: string;
  pricePerTask: string;
  categoryIds: string[];
  walletAddress: string;
  encryptedSeedPhrase: string;
}) {
  try {
    return await prisma.agent.create({
      data,
      select: agentPublicSelect,
    });
  } catch (error) {
    throw new Error(
      `createAgent failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getAgentById(id: string) {
  try {
    return await prisma.agent.findUnique({
      where: { id },
      select: agentPublicSelect,
    });
  } catch (error) {
    throw new Error(
      `getAgentById failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Internal use only — for WDK signing operations. Never return this to the client.
export async function getAgentWithSeed(id: string) {
  try {
    return await prisma.agent.findUnique({
      where: { id },
      select: {
        id: true,
        walletAddress: true,
        encryptedSeedPhrase: true,
        systemPrompt: true,
        pricePerTask: true,
      },
    });
  } catch (error) {
    throw new Error(
      `getAgentWithSeed failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getAgentsByOwner(ownerId: string) {
  try {
    return await prisma.agent.findMany({
      where: { ownerId },
      select: agentPublicSelect,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    throw new Error(
      `getAgentsByOwner failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getActiveAgents(filters?: { category?: string }) {
  try {
    return await prisma.agent.findMany({
      where: {
        status: AgentStatus.ACTIVE,
        ...(filters?.category
          ? { categories: { has: filters.category } }
          : {}),
      },
      select: agentPublicSelect,
      orderBy: { rating: "desc" },
    });
  } catch (error) {
    throw new Error(
      `getActiveAgents failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function updateAgentStatus(id: string, status: AgentStatus) {
  try {
    return await prisma.agent.update({
      where: { id },
      data: { status },
      select: agentPublicSelect,
    });
  } catch (error) {
    throw new Error(
      `updateAgentStatus failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function updateAgentSettings(
  id: string,
  data: { status?: AgentStatus; systemPrompt?: string; pricePerTask?: string }
) {
  try {
    return await prisma.agent.update({
      where: { id },
      data,
      select: agentPublicSelect,
    });
  } catch (error) {
    throw new Error(
      `updateAgentSettings failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function incrementAgentEarnings(id: string, amountUsdt: string) {
  try {
    return await prisma.agent.update({
      where: { id },
      data: { totalEarned: { increment: amountUsdt } },
      select: { id: true, totalEarned: true },
    });
  } catch (error) {
    throw new Error(
      `incrementAgentEarnings failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function incrementAgentSpend(id: string, amountUsdt: string) {
  try {
    return await prisma.agent.update({
      where: { id },
      data: { totalSpent: { increment: amountUsdt } },
      select: { id: true, totalSpent: true },
    });
  } catch (error) {
    throw new Error(
      `incrementAgentSpend failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function incrementJobsCompleted(id: string) {
  try {
    return await prisma.agent.update({
      where: { id },
      data: { jobsCompleted: { increment: 1 } },
      select: { id: true, jobsCompleted: true },
    });
  } catch (error) {
    throw new Error(
      `incrementJobsCompleted failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
