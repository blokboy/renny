import type { SpellCostModel } from "./types";

/**
 * One flat baseline mana cost applies to any cast — proposed at 10% of
 * current max mana pool (`prompt-quest-full-spec.md` §5.1). This fraction
 * itself is the spec's own number, not a placeholder; what *is* a
 * placeholder (see `starting-stats.ts`) is the max mana pool it's a
 * percentage of, since issue #5 hasn't sized that yet.
 */
export const BASELINE_COST_FRACTION = 0.1;

/**
 * Resolves a `SpellCostModel` against a (placeholder) max mana pool into a
 * displayable cost: `"Free"` or a whole-number mana amount.
 */
export function resolveSpellCost(maxMana: number, model: SpellCostModel): "Free" | number {
  if (model.kind === "free") {
    return "Free";
  }
  return Math.max(1, Math.round(maxMana * BASELINE_COST_FRACTION * model.multiplier));
}

/** Formats a resolved cost for display, e.g. "Free" or "12 mana". */
export function formatSpellCost(maxMana: number, model: SpellCostModel): string {
  const resolved = resolveSpellCost(maxMana, model);
  return resolved === "Free" ? "Free" : `${resolved} mana`;
}
