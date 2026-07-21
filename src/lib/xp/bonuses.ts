/**
 * Economy/Elegance XP bonuses (`prompt-quest-full-spec.md` §3). Both cap at
 * +50% and stack additively — these caps are the spec's own numbers, not
 * placeholders.
 */
const ECONOMY_BONUS_CAP = 0.5;
const ELEGANCE_BONUS_CAP = 0.5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * `bonus% = clamp(50% × (1 − actual_tokens / expected_tokens), 0%, 50%)`.
 * Meeting the expected budget exactly is +0%; using half the budget (or
 * less) plateaus at +50%.
 */
export function getEconomyBonus(actualTokens: number, expectedTokens: number): number {
  if (expectedTokens <= 0) return 0;
  return clamp(ECONOMY_BONUS_CAP * (1 - actualTokens / expectedTokens), 0, ECONOMY_BONUS_CAP);
}

/** `bonus% = elegance_score × 50%`. `eleganceScore` is the Judge's continuous 0-1 output. */
export function getEleganceBonus(eleganceScore: number): number {
  return clamp(eleganceScore, 0, 1) * ELEGANCE_BONUS_CAP;
}

/** Economy and Elegance stack additively on base XP (max +100% total). */
export function getXpMultiplier(economyBonus: number, eleganceBonus: number): number {
  return 1 + economyBonus + eleganceBonus;
}

/** Convenience wrapper: base XP for one judged cast, scaled by both bonuses. */
export function getXpForCast(
  baseXp: number,
  actualTokens: number,
  expectedTokens: number,
  eleganceScore: number,
): number {
  const economyBonus = getEconomyBonus(actualTokens, expectedTokens);
  const eleganceBonus = getEleganceBonus(eleganceScore);
  return Math.round(baseXp * getXpMultiplier(economyBonus, eleganceBonus));
}
