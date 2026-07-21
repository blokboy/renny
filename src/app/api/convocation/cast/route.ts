import { getConvocationStop } from "@/lib/convocation/stops";
import { castFamiliar } from "@/lib/familiar/cast";
import { judgeCast } from "@/lib/judge/judge";
import { resolveOutcome } from "@/lib/combat/resolve";
import { BASE_XP_PER_CAST } from "@/lib/xp/calibration";
import { estimateTokens, getEconomyBonus, getEleganceBonus, getXpForCast } from "@/lib/xp";
import type { ConvocationCastResponse } from "@/lib/convocation/encounter";

export async function POST(request: Request) {
  const body = await request.json();
  const stopId = Number(body?.stopId);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const stop = getConvocationStop(stopId);

  if (!stop) {
    return Response.json({ error: "unknown convocation stop" }, { status: 404 });
  }

  if (!prompt) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const familiarClass = stop.boundClass === "universal" ? "knight" : stop.boundClass;
  const familiarOutput = await castFamiliar(prompt, familiarClass);
  const judge = await judgeCast(familiarOutput, stop.puzzle);
  const resolution = resolveOutcome(judge.score);
  const actualTokens = estimateTokens(prompt);
  const economyBonus = getEconomyBonus(actualTokens, stop.puzzle.expectedTokens);
  const eleganceBonus = getEleganceBonus(judge.elegance);
  const gained = getXpForCast(
    BASE_XP_PER_CAST,
    actualTokens,
    stop.puzzle.expectedTokens,
    judge.elegance,
  );

  const result: ConvocationCastResponse = {
    stopId: stop.id,
    familiarOutput,
    judge,
    resolution,
    xp: {
      baseXp: BASE_XP_PER_CAST,
      gained,
      actualTokens,
      expectedTokens: stop.puzzle.expectedTokens,
      economyBonus,
      eleganceBonus,
    },
  };

  return Response.json(result);
}
