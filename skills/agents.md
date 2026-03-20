# AgenticEra — Agent Runtime Rules

## Where the runtime lives
- All agent execution logic lives in src/lib/agent-runtime.ts
- The API route POST /api/jobs/[id]/run is the only entry point — it calls the runtime, nothing else
- Never put execution logic in the API route handler itself

## Groq
- Model: llama-3.3-70b-versatile
- Client lives in src/lib/groq.ts — never instantiate the Groq client elsewhere
- Always include the agent's systemPrompt as the system message
- Always include the job's taskDescription as the user message
- Always set a reasonable max_tokens limit — never leave it unbounded
- Wrap every Groq call in try/catch — a failed AI call must mark the job FAILED, not crash the server

## Job execution lifecycle
- Job must be in PAID status before execution can start — reject any other status
- On execution start: immediately update job status to IN_PROGRESS
- On success: update job status to DELIVERED, store output in job.output
- On failure: update job status to FAILED, log the error reason
- Never leave a job stuck in IN_PROGRESS — always resolve to DELIVERED or FAILED
- All status transitions are written to the DB before returning a response

## Cost accounting
- Every Groq API call has a USDT cost — calculate it from token usage in the response
- After each Groq call: deduct cost from agent's totalSpent, record an AgentTransaction of type SPENT
- If agent wallet balance is insufficient to cover API cost, mark job FAILED with reason "insufficient balance"
- All cost deductions are atomic with the status update — use prisma.$transaction()

## Agent-to-agent payments
- An agent may decide to hire a sub-agent to complete part of a task
- This decision is made by the agent's own Groq response — never hardcoded
- Sub-agent selection: query available ACTIVE agents from DB, pass list to the agent as context
- Before hiring: verify parent agent wallet has enough USDT to cover sub-agent price
- Payment: call src/lib/wdk.ts sendUsdt from parent agent wallet to sub-agent wallet
- After payment confirmed: create a SubAgentJob record, trigger sub-agent execution
- Sub-agent output is passed back to parent agent as additional context for final response
- All sub-agent payments are recorded as AgentTransaction of type SUB_AGENT_PAYMENT

## Output rules
- Agent output is always a plain string — no enforced format unless the task demands it
- Output is stored in job.output as text — never as a file path or external URL
- If a task requires structured output, the agent's systemPrompt should specify the format
- Never truncate or modify agent output before storing it

## Security and isolation
- Each agent only has access to its own wallet — never pass another agent's seed or keys to the runtime
- The runtime receives agentId and jobId — it fetches everything else from DB itself
- Never expose raw seed phrases inside the runtime — only pass them to src/lib/wdk.ts functions
- Never log job output, task descriptions, or system prompts to stdout in production

## Idempotency
- If a job is already IN_PROGRESS or DELIVERED, the run endpoint must return early — never re-execute
- Sub-agent jobs follow the same rule — check status before triggering execution