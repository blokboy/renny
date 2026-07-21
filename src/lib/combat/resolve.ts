import type { ResolvedCast } from "./types";

/**
 * Not yet specified by the design docs — these thresholds/curve are a
 * provisional placeholder, isolated here so they're a one-file retune once
 * the type-chart (#6) and XP calibration (#9) land.
 */
const HIT_THRESHOLD = 0.6;
const FAIL_THRESHOLD = 0.3;

export function resolveOutcome(score: number): ResolvedCast {
  if (score >= HIT_THRESHOLD) {
    return { outcome: "hit", damage: Math.round(score * 100) };
  }

  if (score >= FAIL_THRESHOLD) {
    return { outcome: "miss", damage: 0 };
  }

  return { outcome: "fail", damage: Math.round((1 - score) * 50) };
}
