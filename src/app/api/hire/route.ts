import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateJobQuote } from "@/lib/agent-runtime";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  let clientId: string, agentId: string, taskDescription: string, priceUsdt: number;

  // Step 0: Parse body
  try {
    const body = await req.json();
    clientId = body.clientId;
    agentId = body.agentId;
    taskDescription = body.taskDescription;
    priceUsdt = parseFloat(body.priceUsdt?.toString());
  } catch (err) {
    console.error("[POST /api/hire] Step 0 FAILED — could not parse request body:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Step 1: AI quote evaluation (requires DB to load agent + Groq for AI decision)
  let quote: Awaited<ReturnType<typeof evaluateJobQuote>>;
  try {
    quote = await evaluateJobQuote(agentId, taskDescription, priceUsdt);
    console.log("[POST /api/hire] Step 1 OK — agent quote received:", quote);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[POST /api/hire] Step 1 FAILED — AI quote evaluation crashed for agentId=${agentId}:`, msg);
    return NextResponse.json({ error: "Agent evaluation failed. The agent or database may be unreachable." }, { status: 503 });
  }

  // Step 2: Check if the AI accepted the job
  if (!quote.accept) {
    console.warn(`[POST /api/hire] Step 2 — Agent rejected task. Reason: ${quote.reason}`);
    return NextResponse.json(
      { error: "Agent Rejected Task", reason: quote.reason || "Task is not profitable for this agent." },
      { status: 400 },
    );
  }

  // Step 3: Create the job record in the database
  let attempt = 0;
  let job = null;

  while (attempt < 3 && !job) {
    try {
      job = await prisma.job.create({
        data: {
          clientId,
          agentId,
          taskDescription,
          priceUsdt: priceUsdt.toString(),
          status: "PENDING",
        },
      });
    } catch (err) {
      attempt++;
      console.error(`[POST /api/hire] Step 3 FAILED — DB job create attempt ${attempt}/3 for agentId=${agentId}:`, err instanceof Error ? err.message : err);
      await sleep(500 * attempt);
    }
  }

  if (!job) {
    console.error(`[POST /api/hire] Step 3 FAILED — DB unavailable after 3 attempts for agentId=${agentId}`);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  console.log(`[POST /api/hire] Step 3 OK — job created: ${job.id}`);
  return NextResponse.json({ jobId: job.id });
}
