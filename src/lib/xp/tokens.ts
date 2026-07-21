/**
 * PLACEHOLDER — rough chars/4 token-count heuristic, not tied to any
 * specific model's real tokenizer. Isolated here (ADR-precedent: see
 * `resolve.ts`'s `HIT_THRESHOLD`/`FAIL_THRESHOLD`) purely so the Economy
 * bonus has an "actual tokens used" input to compute against. A sibling
 * issue (#5) may add its own INT/token-budget heuristic independently —
 * reconciling the two into one shared utility is a later cleanup, not
 * something this file depends on.
 */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}
