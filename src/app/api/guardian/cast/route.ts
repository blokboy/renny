import { CLASSES, getClassSkillAtLevel, getCastManaCost, type CharacterStats, type ClassId } from "@/lib/character";
import { isWithinTokenBudget, getTokenBudget } from "@/lib/character/tokens";
import { rollCrit, resolveOutcome } from "@/lib/combat/resolve";
import { PUZZLE_FAMILIES } from "@/lib/combat/typeChart";
import type { GuardianCastRequest, GuardianCastResponse, GuardianPuzzle } from "@/lib/guardian";
import { castFamiliar } from "@/lib/familiar/cast";
import { judgeCast } from "@/lib/judge/judge";
import { BASE_XP_PER_CAST, estimateTokens, getXpForCast } from "@/lib/xp";

function isClassId(value: unknown): value is ClassId {
  return typeof value === "string" && CLASSES.some(({ id }) => id === value);
}

function isStats(value: unknown): value is CharacterStats {
  if (!value || typeof value !== "object") return false;
  const stats = value as Record<string, unknown>;
  return ["str", "int", "wis", "spd", "lck"].every(
    (key) => typeof stats[key] === "number" && Number.isFinite(stats[key]) && (stats[key] as number) > 0,
  );
}

function isGuardianPuzzle(value: unknown): value is GuardianPuzzle {
  if (!value || typeof value !== "object") return false;
  const puzzle = value as Record<string, unknown>;
  return (
    typeof puzzle.id === "string" &&
    typeof puzzle.title === "string" &&
    typeof puzzle.flavor === "string" &&
    typeof puzzle.brief === "string" &&
    typeof puzzle.rubric === "string" &&
    typeof puzzle.expectedTokens === "number" &&
    typeof puzzle.family === "string" &&
    (PUZZLE_FAMILIES as readonly string[]).includes(puzzle.family)
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<GuardianCastRequest>;
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }
  if (!isClassId(body.classId) || !isStats(body.stats) || !isGuardianPuzzle(body.puzzle)) {
    return Response.json({ error: "invalid character or puzzle payload" }, { status: 400 });
  }
  if (typeof body.maxMana !== "number" || body.maxMana <= 0) {
    return Response.json({ error: "valid maxMana is required" }, { status: 400 });
  }
  if (!isWithinTokenBudget(prompt, body.stats.int)) {
    return Response.json(
      { error: `Prompt exceeds your INT token budget (${getTokenBudget(body.stats.int)} tokens).` },
      { status: 400 },
    );
  }

  const skill = getClassSkillAtLevel(body.classId, 1);
  const resolvedManaCost = getCastManaCost(
    body.maxMana,
    skill.cost,
    body.classId,
    body.puzzle.family,
  );
  const manaCost = resolvedManaCost === "Free" ? 0 : resolvedManaCost;
  if (typeof body.currentMana !== "number" || body.currentMana < manaCost) {
    return Response.json({ error: `Not enough mana. This cast costs ${manaCost}.` }, { status: 400 });
  }
  const familiarOutput = await castFamiliar(prompt, body.classId);
  const judge = await judgeCast(familiarOutput, body.puzzle);
  const isCrit = rollCrit(judge.score, body.stats.lck);
  const resolution = resolveOutcome(judge.score, body.stats.str, isCrit);
  const xpGained = getXpForCast(
    BASE_XP_PER_CAST,
    estimateTokens(prompt),
    body.puzzle.expectedTokens,
    judge.elegance,
  );

  const result: GuardianCastResponse = {
    familiarOutput,
    judge,
    resolution,
    manaCost,
    xpGained,
  };
  return Response.json(result);
}
