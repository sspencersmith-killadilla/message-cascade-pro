import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

const MODEL = "openai/gpt-6-astra";

export class AiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Streams a single prompt through Lovable AI and returns the final text. */
export async function runAi(instructions: string, prompt: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError("AI is not configured", 401);
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  let failure: unknown = null;
  const result = streamText({
    model: provider.responses(MODEL),
    instructions,
    messages: [{ role: "user", content: prompt }],
    onError: ({ error }) => {
      failure = error;
    },
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  const text = await result.text;
  if (failure || !text.trim()) {
    const status = (failure as { statusCode?: number } | null)?.statusCode ?? 500;
    const msg =
      status === 402
        ? "AI credits are used up. Add credits in Settings → Plans & credits."
        : status === 429
          ? "AI is busy right now. Please try again in a minute."
          : status === 403
            ? "AI access is blocked for this workspace."
            : "The AI couldn't complete this request.";
    console.error("AI failure", failure);
    throw new AiError(msg, status);
  }
  return text;
}

export function parseJson<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return JSON.parse(text.slice(start, end + 1)) as T;
}
