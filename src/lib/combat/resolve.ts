import type { ResolvedCast } from "./types";

/**
 * Not yet specified by the design docs — these thresholds/curve are a
 * provisional placeholder, isolated here so they're a one-file retune once
 * the type-chart (#6) and XP calibration (#9) land.
 */
const HIT_THRESHOLD = 0.6;
const FAIL_THRESHOLD = 0.3;

/**
 * STR is "the one dedicated damage stat" (`prompt-quest-full-spec.md` §5.3)
 * and applies as a flat multiplier — `str / STR_DAMAGE_REFERENCE`.
 * `STR_DAMAGE_REFERENCE` is this file's own scale choice (the spec doesn't
 * give one): 10 is the roughly-averaged Level-1 STR across the 7 classes
 * (`starting-stats.ts`), so a class at that average deals unmultiplied
 * damage and STR only ever pushes damage up or down from there. Only the
 * "hit" branch is scaled — "fail" is self-inflicted backfire, not damage
 * *dealt*, so STR (a damage-dealing stat) deliberately doesn't touch it.
 */
const STR_DAMAGE_REFERENCE = 10;

/**
 * "Damage | Judge's score against the hidden rubric (+ crit for
 * near-perfect)" (`prompt-quest-design-doc.md` §3) — general crit mechanic,
 * distinct from Monk's own puzzle-family crit table (`typeChart.ts`'s
 * `getCritChance`, §7). Only a near-perfect score can crit at all;
 * `LCK_CRIT_REFERENCE`/`CRIT_DAMAGE_MULTIPLIER` are this file's own scale
 * choices, isolated and documented per the same precedent as the thresholds
 * above.
 */
const NEAR_PERFECT_SCORE = 0.9;
const LCK_CRIT_REFERENCE = 40;
const MAX_LCK_CRIT_CHANCE = 0.5;
const CRIT_DAMAGE_MULTIPLIER = 2;

/**
 * Whether a cast crits — LCK contributes to crit chance (§5.3), but only a
 * near-perfect judge score is eligible to roll at all. Split out from
 * `resolveOutcome` so the randomness (and its `rng` override for tests) is
 * isolated from the otherwise-pure damage math.
 */
export function rollCrit(score: number, lck: number, rng: () => number = Math.random): boolean {
  if (score < NEAR_PERFECT_SCORE) return false;
  const chance = Math.min(MAX_LCK_CRIT_CHANCE, lck / LCK_CRIT_REFERENCE);
  return rng() < chance;
}

/**
 * `str` defaults to `STR_DAMAGE_REFERENCE` (a neutral ×1 multiplier) and
 * `isCrit` defaults to `false`, so existing callers that don't yet have a
 * caster's stats in hand keep today's behavior unchanged.
 */
export function resolveOutcome(
  score: number,
  str: number = STR_DAMAGE_REFERENCE,
  isCrit: boolean = false,
): ResolvedCast {
  const strMultiplier = str / STR_DAMAGE_REFERENCE;

  if (score >= HIT_THRESHOLD) {
    const damage = Math.round(score * 100 * strMultiplier);
    return {
      outcome: "hit",
      damage: isCrit ? damage * CRIT_DAMAGE_MULTIPLIER : damage,
      isCrit,
    };
  }

  if (score >= FAIL_THRESHOLD) {
    return { outcome: "miss", damage: 0, isCrit: false };
  }

  return { outcome: "fail", damage: Math.round((1 - score) * 50), isCrit: false };
}
