import type { ClassId, CharacterStats } from "@/lib/character";
import { getCumulativeXpToLevel } from "./curve";
import { getXpMultiplier } from "./bonuses";
import { applyXpGain, type LevelState } from "./leveling";

/**
 * PLACEHOLDER — the actual Convocation (#10) and Threshold Guardian
 * (#11/#12) encounters aren't puzzle-instrumented yet (both still open,
 * blocked on this issue and #7/#8), so a literal end-to-end playthrough
 * can't be run. This simulates the onboarding funnel's ~9-10 discrete
 * judged casts instead, using an assumed "typical" per-cast performance —
 * isolated and documented per this repo's ADR precedent (see
 * `resolve.ts`'s `HIT_THRESHOLD`/`FAIL_THRESHOLD`), to be replaced with
 * real per-encounter tuning once #10/#11/#12 exist.
 */
export const ONBOARDING_CAST_COUNT = 10;

/**
 * `BASE_XP_PER_CAST` is fit so that `ONBOARDING_CAST_COUNT` casts, each
 * averaging the midpoint of both bonus ranges (Economy 25%, Elegance 25% ->
 * a 1.5x multiplier), sum to the Level 1->10 cumulative target:
 *
 *   getCumulativeXpToLevel(10) ≈ 5552
 *   5552 / (10 × 1.5) ≈ 370.1
 *
 * Rounded *up* to 371 (rather than to-nearest) so `SIMULATED_CAST_PERFORMANCE`
 * below — which distributes the 25%/25% average unevenly across casts,
 * same as a real playthrough would — still clears Level 10 on the last
 * cast rather than falling just short of it on rounding alone.
 */
export const BASE_XP_PER_CAST = 371;

/**
 * A synthetic "typical" onboarding playthrough: per-cast (economyBonus,
 * eleganceBonus) pairs that vary cast-to-cast (some tight/elegant, some
 * loose/wordy) but average to the same 25%/25% midpoint `BASE_XP_PER_CAST`
 * was fit against — demonstrating the curve converges under realistic
 * variance, not just at the exact average.
 */
const SIMULATED_CAST_PERFORMANCE: Array<{ economyBonus: number; eleganceBonus: number }> = [
  { economyBonus: 0.1, eleganceBonus: 0.1 },
  { economyBonus: 0.5, eleganceBonus: 0.4 },
  { economyBonus: 0.2, eleganceBonus: 0.3 },
  { economyBonus: 0.0, eleganceBonus: 0.2 },
  { economyBonus: 0.4, eleganceBonus: 0.5 },
  { economyBonus: 0.3, eleganceBonus: 0.1 },
  { economyBonus: 0.1, eleganceBonus: 0.4 },
  { economyBonus: 0.5, eleganceBonus: 0.2 },
  { economyBonus: 0.2, eleganceBonus: 0.0 },
  { economyBonus: 0.2, eleganceBonus: 0.3 },
];

export interface CalibrationCastStep {
  index: number;
  economyBonus: number;
  eleganceBonus: number;
  xpGained: number;
  level: number;
  xp: number;
  levelsGained: number;
}

export interface CalibrationResult {
  targetLevel: number;
  targetXp: number;
  finalLevel: number;
  finalXp: number;
  totalXpGained: number;
  /** `finalLevel === targetLevel`, within this simulation's placeholder tuning. */
  hitsTarget: boolean;
  steps: CalibrationCastStep[];
}

/** Placeholder starting stats — arbitrary since this check only cares about level/XP convergence. */
const PLACEHOLDER_STATS: CharacterStats = { str: 10, int: 10, wis: 10, spd: 10, lck: 10 };

export function runCalibration(classId: ClassId = "wizard"): CalibrationResult {
  let state: LevelState = { level: 1, xp: 0 };
  let stats = PLACEHOLDER_STATS;
  let totalXpGained = 0;
  const steps: CalibrationCastStep[] = [];

  SIMULATED_CAST_PERFORMANCE.slice(0, ONBOARDING_CAST_COUNT).forEach((cast, i) => {
    const xpGained = Math.round(
      BASE_XP_PER_CAST * getXpMultiplier(cast.economyBonus, cast.eleganceBonus),
    );
    totalXpGained += xpGained;

    const result = applyXpGain(state, xpGained, classId, stats);
    state = result.state;
    stats = result.stats;

    steps.push({
      index: i + 1,
      economyBonus: cast.economyBonus,
      eleganceBonus: cast.eleganceBonus,
      xpGained,
      level: state.level,
      xp: state.xp,
      levelsGained: result.levelsGained,
    });
  });

  const targetLevel = 10;
  const targetXp = getCumulativeXpToLevel(targetLevel);

  return {
    targetLevel,
    targetXp,
    finalLevel: state.level,
    finalXp: state.xp,
    totalXpGained,
    hitsTarget: state.level === targetLevel,
    steps,
  };
}
