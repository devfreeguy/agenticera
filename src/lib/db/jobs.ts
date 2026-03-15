import { prisma } from "@/lib/prisma";
import { JobStatus } from "@/generated/prisma/enums";

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

const jobBaseSelect = {
  id: true,
  clientId: true,
  agentId: true,
  taskDescription: true,
  priceUsdt: true,
  status: true,
  output: true,
  txHash: true,
  createdAt: true,
  updatedAt: true,
} as const;

const jobWithRelationsSelect = {
  ...jobBaseSelect,
  agent: { select: agentPublicSelect },
  client: { select: { id: true, walletAddress: true } },
} as const;

export async function createJob(data: {
  clientId: string;
  agentId: string;
  taskDescription: string;
  priceUsdt: string;
}) {
  try {
    return await prisma.job.create({
      data,
      select: jobBaseSelect,
    });
  } catch (error) {
    throw new Error(
      `createJob failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getJobById(id: string) {
  try {
    return await prisma.job.findUnique({
      where: { id },
      select: jobWithRelationsSelect,
    });
  } catch (error) {
    throw new Error(
      `getJobById failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getJobsByClient(clientId: string) {
  try {
    return await prisma.job.findMany({
      where: { clientId },
      select: jobWithRelationsSelect,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    throw new Error(
      `getJobsByClient failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getJobsByAgent(agentId: string) {
  try {
    return await prisma.job.findMany({
      where: { agentId },
      select: jobWithRelationsSelect,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    throw new Error(
      `getJobsByAgent failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function updateJobStatus(id: string, status: JobStatus) {
  try {
    return await prisma.job.update({
      where: { id },
      data: { status },
      select: jobBaseSelect,
    });
  } catch (error) {
    throw new Error(
      `updateJobStatus failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function updateJobOutput(id: string, output: string, txHash?: string) {
  try {
    return await prisma.job.update({
      where: { id },
      data: {
        output,
        ...(txHash ? { txHash } : {}),
      },
      select: jobBaseSelect,
    });
  } catch (error) {
    throw new Error(
      `updateJobOutput failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function setJobPaid(id: string, txHash: string) {
  try {
    return await prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.PAID,
        txHash,
      },
      select: jobBaseSelect,
    });
  } catch (error) {
    throw new Error(
      `setJobPaid failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
