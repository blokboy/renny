import type { CharacterStats, ClassId } from "@/lib/character";
import { XP_to_next } from "./curve";

export interface LevelState {
  level: number;
  xp: number;
}

/**
 * TODO(#5): wire to the real per-class stat-growth function once issue #5
 * ("Stats & Mana Economy") lands — it owns how much each of the 5 stats
 * actually grows per level. This is a trivial stub (flat +1 to every stat)
 * only so level-up logic here compiles and is testable; `classId` is
 * unused today but kept in the signature so callers don't need to change
 * once the real per-class growth table is wired in.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- seam for #5's real growth table
export function applyLevelUp(stats: CharacterStats, classId: ClassId): CharacterStats {
  return {
    str: stats.str + 1,
    int: stats.int + 1,
    wis: stats.wis + 1,
    spd: stats.spd + 1,
    lck: stats.lck + 1,
  };
}

export interface XpGainResult {
  state: LevelState;
  stats: CharacterStats;
  levelsGained: number;
}

/**
 * Applies an XP grant to a character's level/xp state, running the level-up
 * loop (via `applyLevelUp`) once per threshold crossed — so a single large
 * XP grant can produce multiple level-ups in one call, per the "stat
 * increments apply on every level-up (not just tier-band boundaries)"
 * acceptance criterion.
 */
export function applyXpGain(
  state: LevelState,
  xpGained: number,
  classId: ClassId,
  stats: CharacterStats,
): XpGainResult {
  let level = state.level;
  let xp = state.xp + xpGained;
  let nextStats = stats;
  let levelsGained = 0;

  while (xp >= XP_to_next(level)) {
    xp -= XP_to_next(level);
    level += 1;
    nextStats = applyLevelUp(nextStats, classId);
    levelsGained += 1;
  }

  return { state: { level, xp }, stats: nextStats, levelsGained };
}
