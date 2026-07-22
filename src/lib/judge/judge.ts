import { generateText } from "ai";
import { z } from "zod";
import { getJudgeModel } from "@/lib/familiar/router";
import type { JudgeResult, Puzzle } from "@/lib/combat/types";

// Structured-output modes (tool-calling / json-schema forcing) aren't
// reliably supported across the open-weight models this routes to, so the
// Judge asks for plain JSON text and validates it here instead.
const judgeResponseSchema = z.object({
  score: z.number().min(0).max(1),
  elegance: z.number().min(0).max(1),
  feedback: z.string(),
});

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

export async function judgeCast(
  familiarOutput: string,
  puzzle: Puzzle,
): Promise<JudgeResult> {
  const { text } = await generateText({
    model: getJudgeModel(),
    maxOutputTokens: 80,
    system:
      "You are the Judge in a prompt-engineering RPG. Score a familiar's output " +
      "against the given rubric. Be strict and consistent. Also return a continuous " +
      "0-1 elegance score — how minimal/precise the player's prompt was, not how good " +
      "the familiar's output was. Keep feedback to 25 words or fewer. Respond with ONLY " +
      'minified JSON matching {"score": number 0-1, "elegance": number 0-1, "feedback": ' +
      "string} — no markdown fences, no other text.",
    prompt:
      `Rubric:\n${puzzle.rubric}\n\n` +
      `Familiar's output:\n${familiarOutput}`,
  });

  const parsed = JSON.parse(extractJson(text));
  return judgeResponseSchema.parse(parsed);
}
