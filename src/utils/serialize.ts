import type { AgentPublic, JobWithRelations } from "@/types/index";

type DecimalLike = { toString(): string };

type RawAgent = {
  id: string;
  ownerId: string;
  name: string;
  systemPrompt: string;
  pricePerTask: DecimalLike;
  categories: string[];
  walletAddress: string;
  status: AgentPublic["status"];
  totalEarned: DecimalLike;
  totalSpent: DecimalLike;
  rating: number;
  jobsCompleted: number;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeAgent(raw: RawAgent): AgentPublic {
  return {
    ...raw,
    pricePerTask: raw.pricePerTask.toString(),
    totalEarned: raw.totalEarned.toString(),
    totalSpent: raw.totalSpent.toString(),
  };
}

export type SerializedTransaction = {
  id: string;
  agentId: string;
  type: string;
  amountUsdt: string;
  txHash: string | null;
  description: string;
  createdAt: Date;
};

export function serializeTransaction(raw: {
  id: string;
  agentId: string;
  type: string;
  amountUsdt: DecimalLike;
  txHash: string | null;
  description: string;
  createdAt: Date;
}): SerializedTransaction {
  return {
    ...raw,
    amountUsdt: raw.amountUsdt.toString(),
  };
}

export function serializeJob(raw: {
  id: string;
  clientId: string;
  agentId: string;
  taskDescription: string;
  priceUsdt: DecimalLike;
  status: JobWithRelations["status"];
  output: string | null;
  txHash: string | null;
  createdAt: Date;
  updatedAt: Date;
  agent: RawAgent;
  client: { id: string; walletAddress: string };
}): JobWithRelations {
  return {
    ...raw,
    priceUsdt: raw.priceUsdt.toString(),
    agent: serializeAgent(raw.agent),
  };
}
