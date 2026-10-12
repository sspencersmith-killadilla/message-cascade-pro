import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { runAi, parseJson, AiError } from "./ai.server";

// Public (no sign-in) so the demo works for visitors. Input is size-capped to limit cost.
const input = z.object({
  title: z.string().max(200),
  message: z.string().max(4000),
  responses: z
    .array(z.object({ department: z.string().max(60), feedback: z.string().min(1).max(1000), questions: z.string().max(500).optional() }))
    .min(1)
    .max(12),
});

const out = z.object({
  overview: z.string(),
  themes: z.array(z.object({ title: z.string(), detail: z.string() })),
  concerns: z.array(z.string()),
  questions: z.array(z.string()),
});
export type DemoSummary = z.infer<typeof out>;

export const summarizeDemoFeedback = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => input.parse(i))
  .handler(async ({ data }): Promise<{ summary: DemoSummary | null; error: string | null }> => {
    const body = data.responses
      .map((r, i) => `#${i + 1} [${r.department}] Feedback: ${r.feedback}${r.questions ? `\nQuestions: ${r.questions}` : ""}`)
      .join("\n\n");
    try {
      const text = await runAi(
        'You analyze team feedback on an organizational announcement. Reply ONLY with a JSON object: {"overview": string (2-3 sentences), "themes": [{"title": string, "detail": string}], "concerns": string[], "questions": string[] (distinct open questions leadership should answer)}. Be concise and neutral, never name individuals. Use empty arrays when there is nothing to report.',
        `Announcement: ${data.title}\n${data.message}\n\nFeedback from managers:\n${body}`,
      );
      return { summary: out.parse(parseJson(text)), error: null };
    } catch (e) {
      console.error("demo summary failed", e);
      return { summary: null, error: e instanceof AiError ? e.message : "The AI couldn't summarize this feedback." };
    }
  });
