import { castFamiliar } from "@/lib/familiar/cast";
import { judgeCast } from "@/lib/judge/judge";
import { resolveOutcome, rollCrit } from "@/lib/combat/resolve";
import { DEMO_PUZZLE } from "@/lib/combat/puzzles";
import { isWithinTokenBudget, getTokenBudget } from "@/lib/character/tokens";
import type { CharacterStats } from "@/lib/character/types";
import type { CastResult } from "@/lib/combat/types";

/**
 * `casterStats` is optional in the request body — the debug page sends it
 * when a character exists (issue #5); when absent, resolution falls back to
 * `resolveOutcome`'s own neutral defaults. No live battle state (current
 * mana, party turn order) exists yet to gate WIS/SPD on here — that's a
 * future combat loop's job, not this demo route's.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const casterStats: CharacterStats | undefined = body?.casterStats;

  if (!prompt) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  if (casterStats && !isWithinTokenBudget(prompt, casterStats.int)) {
    return Response.json(
      {
        error: `Prompt exceeds your INT token budget (${getTokenBudget(casterStats.int)} tokens).`,
      },
      { status: 400 },
    );
  }

  const familiarOutput = await castFamiliar(prompt);
  const judge = await judgeCast(familiarOutput, DEMO_PUZZLE);
  const isCrit = casterStats ? rollCrit(judge.score, casterStats.lck) : false;
  const resolution = resolveOutcome(judge.score, casterStats?.str, isCrit);

  const result: CastResult = { familiarOutput, judge, resolution };
  return Response.json(result);
}
