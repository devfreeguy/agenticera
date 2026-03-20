import Groq from "groq-sdk";

export const AGENT_MODEL = "llama-3.1-8b-instant";
// export const AGENT_MODEL = "llama-3.3-70b-versatile";
export const MAX_TOKENS = 2048;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const MARKDOWN_INSTRUCTION =
  "\n\nAlways respond in clear, well-formatted markdown. Never wrap your response in JSON. Never add a preamble like 'Here is my response'. Go straight to the content.";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("econnreset") ||
      msg.includes("econnrefused") ||
      msg.includes("etimedout") ||
      msg.includes("network")
    )
      return true;
  }
  const status = (error as { status?: number })?.status;
  return status === 503 || status === 429;
}

export async function runAgentTask(
  systemPrompt: string,
  taskDescription: string,
  format: "markdown" | "json" = "markdown",
): Promise<{ output: string; promptTokens: number; completionTokens: number }> {
  const resolvedPrompt =
    format === "markdown" ? systemPrompt + MARKDOWN_INSTRUCTION : systemPrompt;

  console.log("[groq] calling model:", AGENT_MODEL);
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`[groq] attempt ${attempt} of 3`);
    try {
      const completion = await groq.chat.completions.create({
        model: AGENT_MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: "system", content: resolvedPrompt },
          { role: "user", content: taskDescription },
        ],
        ...(format === "json"
          ? { response_format: { type: "json_object" } }
          : {}),
      });

      const choice = completion.choices[0];
      if (!choice?.message?.content) {
        throw new Error("Groq returned an empty response");
      }

      const usage = {
        prompt: completion.usage?.prompt_tokens ?? 0,
        completion: completion.usage?.completion_tokens ?? 0,
        total:
          (completion.usage?.prompt_tokens ?? 0) +
          (completion.usage?.completion_tokens ?? 0),
      };
      console.log("[groq] success, tokens:", usage);

      return {
        output: choice.message.content,
        promptTokens: usage.prompt,
        completionTokens: usage.completion,
      };
    } catch (error) {
      lastError = error;
      console.error(
        `[groq] attempt ${attempt} failed:`,
        error instanceof Error ? error.message : String(error),
      );
      if (attempt < 3 && isRetryable(error)) {
        await sleep(2000);
        continue;
      }
      break;
    }
  }

  console.error("[groq] all retries exhausted");
  throw new Error(
    `Groq task failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}
