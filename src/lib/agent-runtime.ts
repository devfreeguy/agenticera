import { getJobById, updateJobStatus } from "@/lib/db/jobs";
import { getAgentWithSeed, getActiveAgents, incrementJobsCompleted } from "@/lib/db/agents";
import { createSubJob, updateSubJobStatus, updateSubJobOutput } from "@/lib/db/subJobs";
import { runAgentTask } from "@/lib/groq";
import { sendUsdt, getAgentBalance } from "@/lib/wdk";
import { prisma } from "@/lib/prisma";
import { JobStatus, SubJobStatus, TransactionType } from "@/generated/prisma/enums";

const USDT_PER_TOKEN = 0.000001;

function calcCost(promptTokens: number, completionTokens: number): string {
  return ((promptTokens + completionTokens) * USDT_PER_TOKEN).toFixed(6);
}

async function recordSpent(
  agentId: string,
  costUsdt: string,
  description: string
): Promise<void> {
  await prisma.$transaction([
    prisma.agentTransaction.create({
      data: { agentId, type: TransactionType.SPENT, amountUsdt: costUsdt, description },
    }),
    prisma.agent.update({
      where: { id: agentId },
      data: { totalSpent: { increment: costUsdt } },
    }),
  ]);
}

type DelegateDecision =
  | { delegate: false; response: string }
  | { delegate: true; subAgentId: string; subTask: string; mainTask: string };

function parseDecision(raw: string): DelegateDecision {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      parsed.delegate === true &&
      typeof parsed.subAgentId === "string" &&
      typeof parsed.subTask === "string" &&
      typeof parsed.mainTask === "string"
    ) {
      return {
        delegate: true,
        subAgentId: parsed.subAgentId,
        subTask: parsed.subTask,
        mainTask: parsed.mainTask,
      };
    }
    if (parsed.delegate === false && typeof parsed.response === "string") {
      return { delegate: false, response: parsed.response };
    }
  } catch {
    // fall through
  }
  return { delegate: false, response: raw };
}

export async function executeJob(
  jobId: string
): Promise<{ output: string; status: "DELIVERED" | "FAILED" }> {
  // Pre-condition checks — throws propagate to the caller (route handles 404/400)
  const job = await getJobById(jobId);
  if (!job) throw new Error("Job not found");
  if (job.status !== JobStatus.PAID) {
    throw new Error(`Expected PAID status, got ${job.status}`);
  }

  // Execution phase — any throw here → FAILED
  try {
    const agentSeed = await getAgentWithSeed(job.agentId);
    if (!agentSeed) throw new Error("Agent seed not found");

    await updateJobStatus(jobId, JobStatus.IN_PROGRESS);

    // Available sub-agents (excluding self)
    const allActive = await getActiveAgents();
    const subAgents = allActive.filter((a) => a.id !== job.agentId);

    const subAgentContext =
      subAgents.length > 0
        ? `\n\nAvailable sub-agents you may delegate to:\n${subAgents
            .map(
              (a) =>
                `- ID: ${a.id} | Name: ${a.name} | Categories: ${a.categories.join(", ")} | Price: ${a.pricePerTask.toString()} USDT`
            )
            .join("\n")}`
        : "\n\nNo sub-agents are currently available.";

    const decisionSystemPrompt = `${agentSeed.systemPrompt}

You must respond with a JSON object only — no other text.

To handle the task yourself:
{"delegate":false,"response":"<your complete answer>"}

To delegate part of the task to a sub-agent from the list below:
{"delegate":true,"subAgentId":"<id>","subTask":"<specific task for sub-agent>","mainTask":"<what you will synthesize using the sub-agent output>"}`;

    // ── First Groq call: decision ──────────────────────────────────────────────
    const {
      output: decisionRaw,
      promptTokens: dPrompt,
      completionTokens: dCompletion,
    } = await runAgentTask(
      decisionSystemPrompt,
      `Task: ${job.taskDescription}${subAgentContext}`
    );

    const decision = parseDecision(decisionRaw);

    // ── Scenario A: handle alone ───────────────────────────────────────────────
    if (!decision.delegate) {
      await recordSpent(
        job.agentId,
        calcCost(dPrompt, dCompletion),
        `Execution for job ${jobId} (${dPrompt + dCompletion} tokens)`
      );
      await prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.DELIVERED, output: decision.response },
      });
      await incrementJobsCompleted(job.agentId);
      return { output: decision.response, status: "DELIVERED" };
    }

    // ── Scenario B: delegate ───────────────────────────────────────────────────
    const subAgent = subAgents.find((a) => a.id === decision.subAgentId);
    const subAgentPrice = subAgent?.pricePerTask.toString() ?? "0";
    const parentBalance = subAgent
      ? await getAgentBalance(agentSeed.walletAddress)
      : "0";
    const canDelegate =
      subAgent && parseFloat(parentBalance) >= parseFloat(subAgentPrice);

    if (!canDelegate) {
      // Fallback: run the task directly
      const {
        output: fallbackOutput,
        promptTokens: fbPrompt,
        completionTokens: fbCompletion,
      } = await runAgentTask(agentSeed.systemPrompt, job.taskDescription);
      await recordSpent(
        job.agentId,
        calcCost(dPrompt + fbPrompt, dCompletion + fbCompletion),
        `Decision + fallback execution for job ${jobId} (${dPrompt + dCompletion + fbPrompt + fbCompletion} tokens)`
      );
      await prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.DELIVERED, output: fallbackOutput },
      });
      await incrementJobsCompleted(job.agentId);
      return { output: fallbackOutput, status: "DELIVERED" };
    }

    // Send USDT from parent agent to sub-agent
    const { txHash: subPaymentTxHash } = await sendUsdt(
      job.agentId,
      subAgent.walletAddress,
      subAgentPrice
    );

    // Create sub-job record
    const subJob = await createSubJob({
      parentJobId: jobId,
      parentAgentId: job.agentId,
      subAgentId: subAgent.id,
      taskDescription: decision.subTask,
      priceUsdt: subAgentPrice,
    });

    await updateSubJobStatus(subJob.id, SubJobStatus.IN_PROGRESS);

    // ── Second Groq call: sub-agent executes its task ──────────────────────────
    const {
      output: subOutput,
      promptTokens: sPrompt,
      completionTokens: sCompletion,
    } = await runAgentTask(subAgent.systemPrompt, decision.subTask);

    await recordSpent(
      subAgent.id,
      calcCost(sPrompt, sCompletion),
      `Sub-agent execution for sub-job ${subJob.id} (${sPrompt + sCompletion} tokens)`
    );

    await updateSubJobOutput(subJob.id, subOutput, subPaymentTxHash);

    // Record SUB_AGENT_PAYMENT on parent
    await prisma.agentTransaction.create({
      data: {
        agentId: job.agentId,
        type: TransactionType.SUB_AGENT_PAYMENT,
        amountUsdt: subAgentPrice,
        txHash: subPaymentTxHash,
        description: `Sub-agent payment to ${subAgent.name} for job ${jobId}`,
      },
    });

    // Increment sub-agent earnings
    await prisma.agent.update({
      where: { id: subAgent.id },
      data: { totalEarned: { increment: subAgentPrice } },
    });

    // ── Third Groq call: parent synthesizes final answer ───────────────────────
    const {
      output: finalOutput,
      promptTokens: fPrompt,
      completionTokens: fCompletion,
    } = await runAgentTask(
      agentSeed.systemPrompt,
      `Original task: ${decision.mainTask}\n\nSub-agent output:\n${subOutput}\n\nUsing the sub-agent output above, complete the original task.`
    );

    // Record parent SPENT for decision + synthesis calls combined
    await recordSpent(
      job.agentId,
      calcCost(dPrompt + fPrompt, dCompletion + fCompletion),
      `Decision + synthesis calls for job ${jobId} (${dPrompt + dCompletion + fPrompt + fCompletion} tokens)`
    );

    await prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.DELIVERED, output: finalOutput },
    });

    await incrementJobsCompleted(job.agentId);
    await incrementJobsCompleted(subAgent.id);

    return { output: finalOutput, status: "DELIVERED" };
  } catch (error) {
    await updateJobStatus(jobId, JobStatus.FAILED).catch(() => null);
    return { output: "", status: "FAILED" };
  }
}
