/**
 * The per-level XP curve (`prompt-quest-full-spec.md` §3). `XP_BASE = 50` is
 * the spec's own number, not a placeholder — the calibration target in
 * `calibration.ts` is what's actually tuned against it.
 */
export const XP_BASE = 50;

/** XP required to go from `level` to `level + 1`. */
export function XP_to_next(level: number): number {
  return Math.round(XP_BASE * level ** 1.5);
}

/** Cumulative XP to climb from Level 1 to `targetLevel` (exclusive of any XP past it). */
export function getCumulativeXpToLevel(targetLevel: number): number {
  let total = 0;
  for (let level = 1; level < targetLevel; level++) {
    total += XP_to_next(level);
  }
  return total;
}
