/**
 * Token-budget estimation for INT (`prompt-quest-full-spec.md` §5.3: "Max
 * token budget for a single prompt"). No real tokenizer is wired in yet —
 * pulling one in is a dependency this issue doesn't need to take on just to
 * gate prompt length, so a documented chars-per-token heuristic stands in,
 * isolated here the same way `resolve.ts`'s hit/miss/fail thresholds are.
 *
 * `INT_TOKEN_BUDGET_PER_POINT` is this file's own scale choice (not from the
 * spec, which only says INT gates *a* token budget, not the ratio): at 40
 * tokens/point, Level-1 Monk (int 6) gets a 240-token cap and Level-1 Wizard
 * (int 18) gets 720 — wide enough to feel like real prompts, while still
 * keeping Monk's "word-cap discipline" identity meaningfully tighter than
 * Wizard's.
 */
const CHARS_PER_TOKEN_ESTIMATE = 4;
const INT_TOKEN_BUDGET_PER_POINT = 40;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN_ESTIMATE);
}

export function getTokenBudget(int: number): number {
  return int * INT_TOKEN_BUDGET_PER_POINT;
}

export function isWithinTokenBudget(text: string, int: number): boolean {
  return estimateTokens(text) <= getTokenBudget(int);
}
