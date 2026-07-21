import type { CharacterStats, ClassId } from "@/lib/character";
import { getStatsAtLevel } from "@/lib/character";
import { XP_to_next } from "./curve";

export interface LevelState {
  level: number;
  xp: number;
}

export interface XpGainResult {
  state: LevelState;
  stats: CharacterStats;
  levelsGained: number;
}

/**
 * Applies an XP grant to a character's level/xp state, crossing as many
 * `XP_to_next` thresholds as the grant covers in one call — so a single
 * large XP grant can produce multiple level-ups, per the "stat increments
 * apply on every level-up (not just tier-band boundaries)" acceptance
 * criterion.
 *
 * Stats come from issue #5's `getStatsAtLevel(classId, level)` — a pure
 * function of the *final* level, not an incremental per-level mutator.
 * `getStatsAtLevel` is deliberately pure to avoid fractional-growth
 * rounding drift (see its own doc comment), so the correct integration is
 * one recompute at the final level, not one call per level crossed.
 */
export function applyXpGain(state: LevelState, xpGained: number, classId: ClassId): XpGainResult {
  let level = state.level;
  let xp = state.xp + xpGained;
  let levelsGained = 0;

  while (xp >= XP_to_next(level)) {
    xp -= XP_to_next(level);
    level += 1;
    levelsGained += 1;
  }

  return { state: { level, xp }, stats: getStatsAtLevel(classId, level), levelsGained };
}
