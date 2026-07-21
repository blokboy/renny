import { castFamiliar } from "@/lib/familiar/cast";
import { judgeCast } from "@/lib/judge/judge";
import { resolveOutcome } from "@/lib/combat/resolve";
import { DEMO_PUZZLE } from "@/lib/combat/puzzles";
import type { CastResult } from "@/lib/combat/types";

export async function POST(request: Request) {
  const body = await request.json();
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const familiarOutput = await castFamiliar(prompt);
  const judge = await judgeCast(familiarOutput, DEMO_PUZZLE);
  const resolution = resolveOutcome(judge.score);

  const result: CastResult = { familiarOutput, judge, resolution };
  return Response.json(result);
}
