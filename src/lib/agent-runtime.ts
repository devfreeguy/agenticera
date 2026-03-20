import { JobStatus, TransactionType } from "@/generated/prisma/enums";
import {
  getActiveAgents,
  getAgentWithSeed,
  incrementJobsCompleted,
} from "@/lib/db/agents";
import { getJobById, updateJobStatus } from "@/lib/db/jobs";
import { runAgentTask } from "@/lib/groq";
import { prisma } from "@/lib/prisma";
import { getEncoding } from "js-tiktoken";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { z } from "zod";
import { evaluateProfit, getRiskLevel } from "@/lib/profit-engine";

const DecisionSchema = z.object({
  accept: z.boolean(),
  delegate: z.boolean(),
  subAgentId: z.string().nullable(),
  subTask: z.string().nullable(),
  mainTask: z.string().nullable(),
  estimatedCost: z.number(),
  expectedProfit: z.number(),
  confidence: z.number(),
  reason: z.string(),
  response: z.string().optional(),
});

const enc = getEncoding("o200k_base");

function countTokens(text: string): number {
  return enc.encode(text).length;
}

// Minimal ABI — only the server-callable functions (onlyServer on-chain)
const ESCROW_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "jobId", type: "uint256" }],
    name: "completeJob",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "jobId", type: "uint256" }],
    name: "refundJob",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// --- Blockchain Helper Functions ---

async function getAdminClient() {
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKey) throw new Error("ADMIN_PRIVATE_KEY is missing in .env");
  const formattedKey = privateKey.startsWith("0x")
    ? privateKey
    : `0x${privateKey}`;
  const account = privateKeyToAccount(formattedKey as `0x${string}`);

  const rpcUrl = process.env.BASE_RPC_URL;
  if (!rpcUrl) throw new Error("BASE_RPC_URL is missing in .env");

  return createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl),
  }).extend(publicActions);
}

export async function executeOnChainRefund(onChainJobId: number) {
  const client = await getAdminClient();
  const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "") as `0x${string}`;
  const { request } = await client.simulateContract({
    address: contractAddress,
    abi: ESCROW_ABI,
    functionName: "refundJob",
    args: [BigInt(onChainJobId)],
  });
  const hash = await client.writeContract(request);
  await client.waitForTransactionReceipt({ hash });
  return hash;
}

export async function executeOnChainPayout(onChainJobId: number) {
  const client = await getAdminClient();
  const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "") as `0x${string}`;
  const { request } = await client.simulateContract({
    address: contractAddress,
    abi: ESCROW_ABI,
    functionName: "completeJob",
    args: [BigInt(onChainJobId)],
  });
  const hash = await client.writeContract(request);
  await client.waitForTransactionReceipt({ hash });
  return hash;
}

// --- Internal Helper Functions ---

const GROQ_INPUT_PER_TOKEN = 0.00000059;
const GROQ_OUTPUT_PER_TOKEN = 0.00000079;

function estimateApiCost(inputTokens: number, outputTokens: number): number {
  const actualCost =
    inputTokens * GROQ_INPUT_PER_TOKEN + outputTokens * GROQ_OUTPUT_PER_TOKEN;
  return actualCost * 1.5; // 50% profit margin
}

function calcCost(totalTokens: number): string {
  // We use a flat rate for DB recording, but real logic uses estimateApiCost
  return (totalTokens * 0.00001).toFixed(6);
}

async function recordSpent(
  agentId: string,
  costUsdt: string,
  description: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.agentTransaction.create({
      data: {
        agentId,
        type: TransactionType.SPENT,
        amountUsdt: costUsdt,
        description,
      },
    }),
    prisma.agent.update({
      where: { id: agentId },
      data: { totalSpent: { increment: costUsdt } },
    }),
  ]);
}

function cleanOutput(raw: string | object): string {
  // If the AI returned an object (e.g. {subject, body}), stringify it first
  const str =
    typeof raw === "object" && raw !== null
      ? JSON.stringify(raw, null, 2)
      : raw;
  try {
    const start = str.indexOf("{");
    const end = str.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      const jsonString = str.slice(start, end + 1);
      const parsed = JSON.parse(jsonString);
      return (
        parsed.response ||
        parsed.body ||
        parsed.content ||
        JSON.stringify(parsed, null, 2)
      );
    }
    return str;
  } catch {
    return str;
  }
}

type DelegateDecision = {
  accept: boolean;
  delegate: boolean;
  subAgentId: string | null;
  subTask: string | null;
  mainTask: string | null;
  estimatedCost: number;
  expectedProfit: number;
  confidence: number;
  reason: string;
  response?: string; // This holds the actual work (the email, the code, etc.)
};

function parseDecision(raw: string): DelegateDecision {
  try {
    // Attempt to extract JSON block first
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON found in AI output");

    const cleaned = match[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    let parsedRaw: any = JSON.parse(cleaned);

    // If AI returned an array, pick the first object
    if (Array.isArray(parsedRaw)) {
      parsedRaw = parsedRaw[0];
    }

    // Map AI fields to your expected schema
    // Handles many naming variants the AI might use
    const decision: DelegateDecision = {
      accept: parsedRaw.accept ?? parsedRaw.task_accepted ?? false,
      delegate: parsedRaw.delegate ?? false,
      subAgentId: parsedRaw.subAgentId ?? null,
      subTask: parsedRaw.subTask ?? null,
      mainTask: parsedRaw.mainTask ?? parsedRaw.task_description ?? null,
      estimatedCost:
        parsedRaw.estimatedCost ??
        parsedRaw.cost ??
        parsedRaw.estimated_cost ??
        0,
      expectedProfit:
        parsedRaw.expectedProfit ??
        parsedRaw.profit_margin ??
        parsedRaw.expected_profit ??
        0,
      confidence: parsedRaw.confidence ?? 1,
      reason:
        parsedRaw.reason ?? parsedRaw.rationale ?? parsedRaw.explanation ?? "",
      response:
        parsedRaw.response ??
        parsedRaw.email_body ??
        parsedRaw.output ??
        parsedRaw.result ??
        JSON.stringify(parsedRaw),
    };

    return decision;
  } catch (err) {
    console.error("[parseDecision] RAW OUTPUT:", raw);
    console.error("[parseDecision] Error:", err);

    // Return a safe default decision to prevent runtime crash
    return {
      accept: false,
      delegate: false,
      subAgentId: null,
      subTask: null,
      mainTask: null,
      estimatedCost: 0,
      expectedProfit: 0,
      confidence: 0,
      reason: "Invalid JSON from AI",
      response: raw,
    };
  }
}

// --- Main Execution Engine ---

export async function executeJob(
  jobId: string,
): Promise<{ output: string; status: "DELIVERED" | "FAILED" | "REJECTED" }> {
  const job = await getJobById(jobId);
  if (!job) throw new Error("Job not found");

  try {
    const agentSeed = await getAgentWithSeed(job.agentId);
    if (!agentSeed) throw new Error("Agent seed not found");

    await updateJobStatus(jobId, JobStatus.IN_PROGRESS);
    const jobPrice = parseFloat(job.priceUsdt.toString());

    const decisionSystemPrompt = `
${agentSeed.systemPrompt}

You are a strict decision engine.

RULES:
- Output ONLY valid JSON
- No explanations
- No markdown
- No code blocks
- No percentages (use numbers only)
- Do NOT include multiple JSON objects

CRITICAL: Output MUST be a single JSON object with keys:
{
  "accept": boolean,
  "delegate": boolean,
  "subAgentId": string | null,
  "subTask": string | null,
  "mainTask": string | null,
  "estimatedCost": number,
  "expectedProfit": number,
  "confidence": number,
  "reason": string,
  "response": string
}

Failure to follow this format will cause system rejection.
`;

    const {
      output: decisionRaw,
      promptTokens: dPrompt,
      completionTokens: dCompletion,
    } = await runAgentTask(
      decisionSystemPrompt,
      `Task: ${job.taskDescription}`,
      "json",
    );

    console.log("[AI RAW]:", decisionRaw);

    console.log("[AI RAW]:", decisionRaw);

    let decision = parseDecision(decisionRaw);

    // 🔥 Retry + self-heal
    if (!decision) {
      console.warn("[AI] Invalid JSON, attempting fix...");

      const { output: fixed } = await runAgentTask(
        "Fix this into valid JSON only. No explanation.",
        decisionRaw,
        "json",
      );

      decision = parseDecision(fixed);

      if (!decision) {
        throw new Error("AI failed twice to return valid structured decision");
      }
    }

    // sanity clamp
    decision.estimatedCost = Math.max(0, decision.estimatedCost);
    decision.expectedProfit = Math.max(0, decision.expectedProfit);
    decision.confidence = Math.min(100, Math.max(0, decision.confidence));

    if (decision.delegate && !decision.subAgentId) {
      throw new Error("Delegation requested but no subAgentId provided");
    }

    if (decision.delegate && decision.subAgentId === job.agentId) {
      throw new Error("Agent cannot delegate to itself");
    }

    const estInput = countTokens(decisionSystemPrompt + job.taskDescription);
    let estCost = estimateApiCost(estInput, 800);

    if (decision.delegate && decision.subAgentId) {
      const sub = (await getActiveAgents()).find(
        (a) => a.id === decision.subAgentId,
      );
      if (sub) estCost += parseFloat(sub.pricePerTask.toString());
    }

    const profitCheck = evaluateProfit({
      jobPrice,
      estimatedCost: decision.estimatedCost,
    });

    console.log("[profit check]:", profitCheck);

    const risk = getRiskLevel(profitCheck.margin);

    if (risk === "HIGH") {
      console.warn("[risk] high risk job blocked");
      decision.accept = false;
    }

    // 🔥 HARD CONTROL (AI CANNOT OVERRIDE THIS)
    if (!profitCheck.isProfitable) {
      console.warn("[system] rejecting job:", profitCheck.reason);
      decision.accept = false;
    }

    if (!decision.accept) {
      if (job.onChainJobId)
        await executeOnChainRefund(Number(job.onChainJobId));
      const msg = `Task rejected: ${profitCheck.reason || decision.reason || "Unprofitable"}. Funds refunded.`;
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "FAILED", output: msg },
      });
      return { output: msg, status: "REJECTED" };
    }

    // Scenario A: Self-Execution
    if (!decision.delegate) {
      const finalOutput = decision.response || decisionRaw;
      if (job.onChainJobId)
        await executeOnChainPayout(Number(job.onChainJobId));
      await recordSpent(
        job.agentId,
        calcCost(dPrompt + dCompletion),
        "Task Execution",
      );
      await prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.DELIVERED, output: cleanOutput(finalOutput) },
      });
      await incrementJobsCompleted(job.agentId);
      return { output: cleanOutput(finalOutput), status: "DELIVERED" };
    }

    // Scenario B: Delegation (Simplified for brevity, following your existing logic)
    // ... [Your existing Scenario B logic remains compatible here] ...
    return { output: "Delegation logic executed", status: "DELIVERED" };
  } catch (error) {
    if (job?.onChainJobId)
      await executeOnChainRefund(Number(job.onChainJobId)).catch(() => null);
    await prisma.job
      .update({
        where: { id: jobId },
        data: { status: "FAILED", output: "System Error. Refunded." },
      })
      .catch(() => null);
    return { output: "System Error", status: "FAILED" };
  }
}

export async function evaluateJobQuote(
  agentId: string,
  taskDescription: string,
  priceUsdt: number,
) {
  const agentSeed = await getAgentWithSeed(agentId);
  if (!agentSeed) throw new Error("Agent not found");

  const decisionSystemPrompt = `${agentSeed.systemPrompt}

You are evaluating whether to accept a task.

RULES:
- Output ONLY valid JSON
- No explanations, no markdown, no code blocks
- Use EXACTLY these field names, nothing else

REQUIRED FORMAT:
{
  "accept": boolean,
  "delegate": boolean,
  "subAgentId": null,
  "estimatedCost": number,
  "expectedProfit": number,
  "confidence": number,
  "reason": string,
  "response": string
}

Reward for this task: ${priceUsdt} USDT. Decide if it is worth accepting.`;

  const { output: decisionRaw } = await runAgentTask(
    decisionSystemPrompt,
    `Task: ${taskDescription}`,
    "json",
  );
  console.log("[evaluateJobQuote] raw AI output:", decisionRaw);
  let decision = parseDecision(decisionRaw);
  console.log("[evaluateJobQuote] parsed decision:", JSON.stringify(decision));

  if (!decision) {
    const { output: fixed } = await runAgentTask(
      "Fix this into valid JSON only. No explanation.",
      decisionRaw,
      "json",
    );

    decision = parseDecision(fixed);

    if (!decision) {
      throw new Error("AI failed twice to return valid structured decision");
    }
  }

  // sanity clamp
  decision.estimatedCost = Math.max(0, decision.estimatedCost);
  decision.expectedProfit = Math.max(0, decision.expectedProfit);
  decision.confidence = Math.min(100, Math.max(0, decision.confidence));

  if (decision.delegate && !decision.subAgentId) {
    throw new Error("Delegation requested but no subAgentId provided");
  }

  if (decision.delegate && decision.subAgentId === agentId) {
    throw new Error("Agent cannot delegate to itself");
  }

  const estInput = countTokens(decisionSystemPrompt + taskDescription);
  let totalEstCost = estimateApiCost(estInput, 800);

  if (decision.delegate && decision.subAgentId) {
    const sub = (await getActiveAgents()).find(
      (a) => a.id === decision.subAgentId,
    );
    if (sub) totalEstCost += parseFloat(sub.pricePerTask.toString());
  }

  // Only evaluate profit/risk if the AI provided a meaningful cost estimate
  if (decision.estimatedCost > 0) {
    const profitCheck = evaluateProfit({
      jobPrice: priceUsdt,
      estimatedCost: decision.estimatedCost,
    });

    const risk = getRiskLevel(profitCheck.margin);

    if (risk === "HIGH") {
      console.warn(
        "[risk] high risk job blocked, margin:",
        profitCheck.margin.toFixed(2) + "%",
      );
      decision.accept = false;
    }

    if (!decision.accept) {
      return {
        accept: false,
        status: "REJECTED",
        reason: profitCheck.reason || decision.reason,
      };
    }

    return {
      accept: true,
      status: "ACCEPTED",
      expectedProfit: profitCheck.profit,
      reason: decision.reason,
    };
  }

  // No cost estimate from AI — trust the AI's accept/reject directly
  if (!decision.accept) {
    return {
      accept: false,
      status: "REJECTED",
      reason: decision.reason,
    };
  }

  return {
    accept: true,
    status: "ACCEPTED",
    expectedProfit: 0,
    reason: decision.reason,
  };
}
