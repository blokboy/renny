import type { SpellCategory, StatusEffectInstance, StatusEffectType } from "./types";

/**
 * Status Effects (issue #7). Pure apply/tick/cleanse/query functions over
 * `StatusEffectInstance` (see `types.ts`) — no multi-actor battle loop exists
 * yet to consume these (`CONTEXT.md`), so this ships the same way
 * `turnOrder.ts` and `typeChart.ts` did: a standalone, tested engine a future
 * combat loop calls without redesign. See
 * `docs/adr/0006-status-effects-wards.md` for the duration-model write-up.
 *
 * Durations are fixed, flat turn counts — **not** scaled by tier or boss
 * level (`prompt-quest-full-spec.md` §4: scaling them would double-punish
 * low-level characters on top of the puzzle itself getting harder).
 */
export const SLEEP_DURATION_TURNS = 1;
export const SILENCE_DURATION_TURNS = 1;
export const CONFUSION_DURATION_TURNS = 1;

/**
 * Poison is fixed at 2-3 turns (spec §4's one explicit range) — deliberately
 * randomized per-application within that range rather than always picking
 * one end, so "how long will this poison last" stays a little uncertain for
 * the player, the same way a real DoT effect would. `applyPoison`'s `rng`
 * param makes the pick and severity math both testable.
 */
export const POISON_MIN_DURATION_TURNS = 2;
export const POISON_MAX_DURATION_TURNS = 3;

/**
 * Poison is "the one status effect that doesn't stay flat" (issue #7) —
 * severity compounds 10% per turn it isn't cleansed (spec §4). Severity
 * starts at 1 (a neutral ×1) on application; `tickStatusEffects` below
 * multiplies it by `1 + POISON_SEVERITY_GROWTH_RATE` once per turn poison
 * survives, so a future combat loop reads `effect.severity` each turn to
 * scale however it wants to apply poison (e.g. degrading the returned
 * output — see `degradeTextWithPoison` below — or discounting the Judge's
 * score). This engine guarantees the *number* compounds correctly; deciding
 * exactly how severity maps onto damage/degradation belongs to whichever
 * system consumes it, same as `resolve.ts` leaves STR's damage formula
 * isolated from the Judge's own scoring.
 */
export const POISON_STARTING_SEVERITY = 1;
export const POISON_SEVERITY_GROWTH_RATE = 0.1;

/**
 * Silence's default blocked category. The design doc's only concrete example
 * is "no Ward casts" (`prompt-quest-design-doc.md` §Status Effects) — no
 * spell-category taxonomy exists elsewhere yet, so this is the one category
 * silenced by default; callers may pass a different category explicitly once
 * a real taxonomy exists.
 */
export const DEFAULT_SILENCED_CATEGORY: SpellCategory = "ward";

/**
 * Mana Burn's drain, expressed as a fraction of *max* mana rather than a flat
 * number — mirroring `mana.ts`'s `BASELINE_COST_FRACTION` (10% of max mana
 * per cast) so a drain scales sensibly across levels the same way a cast's
 * own cost does. No exact number is given in the spec beyond "a direct
 * drain," so this is a provisional, isolated constant, following the same
 * precedent as `resolve.ts`'s `HIT_THRESHOLD`/`FAIL_THRESHOLD`.
 */
export const MANA_BURN_DRAIN_FRACTION = 0.15;

/**
 * How much a single point of poison severity above baseline (1.0) corrupts a
 * returned/prompt text in `degradeTextWithPoison` — e.g. severity 1.1 (one
 * turn compounded) corrupts ~1.5% of words, severity 1.21 (two turns)
 * corrupts ~3.15%. Not specified numerically by the docs ("degrades a
 * little each turn it lingers," design doc §Status Effects) — an isolated,
 * documented placeholder like the constants above.
 */
export const POISON_DEGRADATION_PER_SEVERITY_POINT = 0.15;

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

/** Sleep: 1-turn duration, skips the caster's action entirely (`isAsleep`). */
export function applySleep(): StatusEffectInstance {
  return { type: "sleep", turnsRemaining: SLEEP_DURATION_TURNS };
}

/** Silence: 1-turn duration, blocks one spell category (`isCategoryBlocked`). */
export function applySilence(
  blockedCategory: SpellCategory = DEFAULT_SILENCED_CATEGORY,
): StatusEffectInstance {
  return { type: "silence", turnsRemaining: SILENCE_DURATION_TURNS, blockedCategory };
}

/** Confusion: 1-turn duration, garbles the prompt before it reaches the familiar (`garblePrompt`). */
export function applyConfusion(): StatusEffectInstance {
  return { type: "confusion", turnsRemaining: CONFUSION_DURATION_TURNS };
}

/**
 * Poison: fixed 2-3 turn duration (never scaled by tier/boss level, per
 * spec §4), severity starting at the neutral baseline. `rng` is injectable
 * for tests, same pattern as `resolve.ts`'s `rollCrit`.
 */
export function applyPoison(rng: () => number = Math.random): StatusEffectInstance {
  const turnsRemaining =
    rng() < 0.5 ? POISON_MIN_DURATION_TURNS : POISON_MAX_DURATION_TURNS;
  return { type: "poison", turnsRemaining, severity: POISON_STARTING_SEVERITY };
}

/**
 * Mana Burn: instant, one-time drain (spec §4 explicitly calls this out as
 * *not* a duration-based effect) — so unlike the four functions above, this
 * doesn't return a `StatusEffectInstance` to track; it just computes the
 * post-drain mana directly. `maxMana` (not `currentMana`) sets the drain
 * amount, matching `mana.ts`'s baseline-cost-as-fraction-of-max convention.
 */
export function applyManaBurn(currentMana: number, maxMana: number): number {
  const drain = Math.round(maxMana * MANA_BURN_DRAIN_FRACTION);
  return Math.max(0, currentMana - drain);
}

// ---------------------------------------------------------------------------
// Tick / Cleanse
// ---------------------------------------------------------------------------

/**
 * Advance every effect by one turn: decrement `turnsRemaining`, compound
 * poison's severity, and drop anything that's expired. Effects are immutable
 * — this returns a new array rather than mutating the input, matching this
 * codebase's pure-function convention throughout `src/lib/combat`.
 */
export function tickStatusEffects(
  effects: readonly StatusEffectInstance[],
): StatusEffectInstance[] {
  return effects
    .map((effect): StatusEffectInstance => {
      if (effect.type === "poison") {
        return {
          ...effect,
          turnsRemaining: effect.turnsRemaining - 1,
          severity:
            (effect.severity ?? POISON_STARTING_SEVERITY) *
            (1 + POISON_SEVERITY_GROWTH_RATE),
        };
      }
      return { ...effect, turnsRemaining: effect.turnsRemaining - 1 };
    })
    .filter((effect) => effect.turnsRemaining > 0);
}

/**
 * Cleanse every active instance of one effect type. For Poison, this is what
 * makes cleansing "meaningfully valuable rather than just wait it out" (issue
 * #7): removing the instance entirely resets severity to nothing, rather than
 * a partial reduction — a freshly re-applied Poison always starts back at
 * `POISON_STARTING_SEVERITY`. Issue #8's skill-tree cleanse triggers (the
 * §5.2 table — Cleric/Poison, Bard/Confusion, Wizard/Silence, Rogue/Mana
 * Burn via immunity, Hunter/Sleep) are expected to call this directly once
 * that issue wires them up; this function only implements the primitive.
 */
export function cleanseStatusEffect(
  effects: readonly StatusEffectInstance[],
  type: StatusEffectType,
): StatusEffectInstance[] {
  return effects.filter((effect) => effect.type !== type);
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

/** True if the caster's action should be skipped entirely this turn. */
export function isAsleep(effects: readonly StatusEffectInstance[]): boolean {
  return effects.some((effect) => effect.type === "sleep");
}

/** True if `category` is currently blocked by an active Silence. */
export function isCategoryBlocked(
  effects: readonly StatusEffectInstance[],
  category: SpellCategory,
): boolean {
  return effects.some(
    (effect) =>
      effect.type === "silence" &&
      (effect.blockedCategory ?? DEFAULT_SILENCED_CATEGORY) === category,
  );
}

/** True if the caster's prompt should be garbled before it reaches the familiar. */
export function isConfused(effects: readonly StatusEffectInstance[]): boolean {
  return effects.some((effect) => effect.type === "confusion");
}

/** The active Poison instance, if any (its `severity` is what's currently in effect this turn). */
export function getActivePoison(
  effects: readonly StatusEffectInstance[],
): StatusEffectInstance | null {
  return effects.find((effect) => effect.type === "poison") ?? null;
}

// ---------------------------------------------------------------------------
// Effects on the cast itself
// ---------------------------------------------------------------------------

/** Fisher-Yates, using the injectable `rng` — shared by `garblePrompt` and `degradeTextWithPoison`. */
function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Confusion: "the caster's own prompt is shuffled ... before it reaches the
 * familiar, at random" (design doc §Status Effects — shuffling is the
 * concrete option named, as opposed to Poison's character-level corruption
 * below). Word-level (not character-level) so a garbled prompt stays a
 * legible-but-scrambled sentence rather than unreadable noise. `rng`
 * injectable for deterministic tests, same as `rollCrit`.
 */
export function garblePrompt(prompt: string, rng: () => number = Math.random): string {
  const words = prompt.split(/\s+/).filter((word) => word.length > 0);
  return shuffle(words, rng).join(" ");
}

const CORRUPTION_MARKER = "�"; // U+FFFD REPLACEMENT CHARACTER

function corruptWord(word: string): string {
  if (word.length <= 1) return CORRUPTION_MARKER;
  const mid = Math.floor(word.length / 2);
  return word.slice(0, mid) + CORRUPTION_MARKER + word.slice(mid + 1);
}

/**
 * Poison: "the effective prompt or the returned answer degrades a little
 * each turn it lingers" (design doc §Status Effects) — unlike Confusion's
 * one-shot shuffle, this scales with the compounding `severity` tracked by
 * `tickStatusEffects`, so poison gets visibly worse the longer it's not
 * cleansed rather than a flat garble. `severity <= 1` (a freshly-applied,
 * not-yet-compounded poison) corrupts nothing — only turns it's allowed to
 * *linger* do damage to the text, matching "each turn it lingers."
 */
export function degradeTextWithPoison(
  text: string,
  severity: number,
  rng: () => number = Math.random,
): string {
  const corruptFraction = Math.min(
    1,
    Math.max(0, severity - 1) * POISON_DEGRADATION_PER_SEVERITY_POINT,
  );
  if (corruptFraction <= 0) return text;

  const words = text.split(/\s+/).filter((word) => word.length > 0);
  return words.map((word) => (rng() < corruptFraction ? corruptWord(word) : word)).join(" ");
}
