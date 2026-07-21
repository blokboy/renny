export interface Puzzle {
  id: string;
  title: string;
  flavor: string;
  /** Shown to the player; describes what a winning cast must accomplish. */
  brief: string;
  /** Judge-only: how to score the familiar's output. Never sent to the familiar. */
  rubric: string;
  /**
   * Puzzle-Master's expected token budget for a winning cast (issue #9's
   * Economy bonus divides actual tokens used by this). No Puzzle-Master
   * generator exists yet (out of scope), so this is authored by hand per
   * puzzle — see `DEMO_PUZZLE` in `puzzles.ts`.
   */
  expectedTokens: number;
}

export interface JudgeResult {
  score: number;
  /**
   * Continuous 0-1 elegance score (superseding the earlier `elegant`
   * boolean — issue #9's Elegance bonus needs a continuous value, and the
   * spec's §4/§2 rubric field is a general "generality/novelty" axis, not a
   * yes/no flag).
   */
  elegance: number;
  feedback: string;
}

export type Outcome = "hit" | "miss" | "fail";

export interface ResolvedCast {
  outcome: Outcome;
  damage: number;
  /** LCK-driven crit (issue #5) — a near-perfect score rolled a crit multiplier. */
  isCrit: boolean;
}

export interface CastResult {
  familiarOutput: string;
  judge: JudgeResult;
  resolution: ResolvedCast;
}

// ---------------------------------------------------------------------------
// Status Effects (issue #7) — see `statusEffects.ts` for the apply/tick/
// cleanse/query functions built on these shapes, and
// `docs/adr/0006-status-effects-wards.md` for the duration-model decision.
// ---------------------------------------------------------------------------

/**
 * The 4 duration-based status effects (`prompt-quest-full-spec.md` §4).
 * **Mana Burn is deliberately excluded** — the spec calls it out as "instant,
 * one-time drain," not a duration-based effect at all, so it never has a
 * `StatusEffectInstance` of its own; see `statusEffects.ts`'s `applyManaBurn`,
 * which just mutates a mana number directly instead of tracking state here.
 */
export type StatusEffectType = "sleep" | "silence" | "confusion" | "poison";

/**
 * What Silence blocks — an open string rather than a closed enum. No
 * spell-category taxonomy exists elsewhere in this codebase yet (`classes.ts`
 * spells aren't tagged by category); the design doc's own example is "no Ward
 * casts" (`prompt-quest-design-doc.md` §Status Effects), so `"ward"` is the
 * one concrete value in use today (`statusEffects.ts`'s
 * `DEFAULT_SILENCED_CATEGORY`). Left open (not a closed union) so a future
 * combat loop can introduce more categories without this type needing to
 * change.
 */
export type SpellCategory = string;

/**
 * One active duration-based status effect on a combatant. `turnsRemaining`
 * counts the current turn as one of its remaining turns (an effect applied
 * with `turnsRemaining: 1` is still active for the turn it lands on, then
 * expires) — see `statusEffects.ts`'s `tickStatusEffects`.
 */
export interface StatusEffectInstance {
  type: StatusEffectType;
  turnsRemaining: number;
  /** Silence only — which spell category this instance blocks. */
  blockedCategory?: SpellCategory;
  /**
   * Poison only — a compounding multiplier, starting at 1 on application and
   * growing 10% per turn it isn't cleansed (`POISON_SEVERITY_GROWTH_RATE` in
   * `statusEffects.ts`). This is the one status effect whose *magnitude*
   * changes turn-over-turn rather than staying flat (spec §4).
   */
  severity?: number;
}
