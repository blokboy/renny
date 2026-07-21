import { getEffectiveCost, type NonMonkClass, type TypeChartOpts } from "@/lib/combat/typeChart";
import type { ClassId, SpellCostModel } from "./types";

/**
 * One flat baseline mana cost applies to any cast — 10% of current max mana
 * pool (`prompt-quest-full-spec.md` §5.1). Taken directly from the spec, not
 * a placeholder.
 */
export const BASELINE_COST_FRACTION = 0.1;

/**
 * Resolves a `SpellCostModel` against a max mana pool into a displayable
 * cost: `"Free"` or a whole-number mana amount. Deliberately has no
 * type-chart/divisor awareness — this is the creation-screen display path
 * (`ClassPicker`), shown before any puzzle/encounter exists to have a family
 * tag. `getCastManaCost` below is the in-combat equivalent.
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

/**
 * `character/types.ts`'s lowercase `ClassId` (storage/lookup key) to
 * `combat/typeChart.ts`'s PascalCase `NonMonkClass` (the type-chart's own
 * enum, kept independent of the character domain since #6 shipped it as a
 * standalone engine). Monk has no entry — the type-chart doesn't divisor-cost
 * Monk casts at all (§7: crit chance instead), and every Monk spell in
 * `classes.ts` is already `{ kind: "free" }`, so `getCastManaCost` below
 * short-circuits before ever needing this map for Monk.
 */
const CLASS_ID_TO_TYPE_CHART_NAME: Record<Exclude<ClassId, "monk">, NonMonkClass> = {
  rogue: "Rogue",
  knight: "Knight",
  wizard: "Wizard",
  bard: "Bard",
  cleric: "Cleric",
  hunter: "Hunter",
};

/**
 * The in-combat mana cost for a cast: baseline (10% of max mana × the
 * spell's surcharge/discount multiplier, `classes.ts`) run through the
 * type-chart's cost divisor (`prompt-quest-full-spec.md` §5.1/§7:
 * `effective cost = base cost ÷ divisor`), given the puzzle's family tag(s).
 *
 * Two edge cases fall back to charging baseline with no divisor, rather than
 * guessing a resolution the docs don't define:
 * - Monk: the type-chart has no divisor concept for Monk (crit chance
 *   instead), so a (currently never-occurring) non-free Monk spell just
 *   charges baseline.
 * - `excluded-same-class-pair`: `getEffectiveCost` itself declines to
 *   compute a divisor for same-class-excluded dual-family pairs and leaves
 *   the resolution to the caller (see `typeChart.ts`) — no combat system
 *   rolls dual-typed encounters yet, so this is an unreachable-today branch
 *   handled conservatively rather than left unhandled.
 */
export function getCastManaCost(
  maxMana: number,
  model: SpellCostModel,
  classId: ClassId,
  primaryFamilyTag: string,
  secondaryFamilyTag?: string | null,
  opts: TypeChartOpts = {},
): "Free" | number {
  if (model.kind === "free") {
    return "Free";
  }

  const baseline = maxMana * BASELINE_COST_FRACTION * model.multiplier;

  if (classId === "monk") {
    return Math.max(1, Math.round(baseline));
  }

  const className = CLASS_ID_TO_TYPE_CHART_NAME[classId];
  const result = getEffectiveCost(className, primaryFamilyTag, secondaryFamilyTag, {
    ...opts,
    baseCost: baseline,
  });

  if (!result.ok) {
    return Math.max(1, Math.round(baseline));
  }

  return Math.max(1, Math.round(result.effectiveCost));
}
