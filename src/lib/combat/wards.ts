import type { StatusEffectInstance } from "./types";

/**
 * Wards (issue #7) — the mechanic behind each class's anti-injection spell.
 * `classes.ts`'s `ward` field already carries each class's name/description
 * (issue #3); this module implements what actually happens when one is cast.
 * See `docs/adr/0006-status-effects-wards.md` for the per-class mechanic
 * write-up and `prompt-quest-design-doc.md`'s Ward section (lines ~57-65) for
 * the flavor each function below is built from.
 *
 * No real prompt-injection classifier (an LLM judge call, say) exists in this
 * repo to detect embedded/injected text — same "no live combat loop" scope
 * limit as the rest of `src/lib/combat` (`CONTEXT.md`). `detectSuspiciousSegments`
 * below is a small, closed, explicitly-provisional marker-based heuristic
 * standing in for that, the same precedent `typeChart.ts`'s
 * `isReversePromptVerbatimCheese` set for its own crude-but-documented
 * verbatim-quoting check. Every class's Ward is built on top of this one
 * shared detector so what differs between classes is each Ward's own
 * *behavior* once something suspicious is found — cheap-and-fast discard,
 * reasoned discard, ensemble reveal, context-corroboration, reflect-chance,
 * or "ignore everything" — not seven reinvented detectors.
 */

// ---------------------------------------------------------------------------
// Shared detector
// ---------------------------------------------------------------------------

/**
 * Closed, provisional list of common instruction-override phrases
 * (case-insensitive substring match). Not exhaustive by design — a real
 * classifier would replace this outright; this is the same class of
 * placeholder as `resolve.ts`'s hit/miss/fail thresholds.
 */
export const INJECTION_MARKER_PHRASES = [
  "ignore previous instructions",
  "ignore all previous instructions",
  "disregard the above",
  "disregard previous instructions",
  "new instructions:",
  "system prompt:",
  "reveal your instructions",
  "you are now",
] as const;

/**
 * Delimiter convention for an explicitly embedded/foreign block of text
 * (e.g. a puzzle quoting scraped or player-supplied content) — anything
 * between `<<` and `>>` is treated as embedded regardless of whether it
 * happens to match a marker phrase, standing in for "this text was quoted
 * from somewhere else, not authored by the puzzle itself."
 */
const EMBEDDED_BLOCK_PATTERN = /<<([\s\S]*?)>>/g;

export interface DetectedInjection {
  /** The exact matched substring, as it appears in the source text. */
  segment: string;
  reason: "marker-phrase" | "embedded-block";
  /** Where `segment` starts in the original `text` — lets `stripSuspiciousSegments` handle overlaps correctly (e.g. a marker phrase quoted inside an embedded block). */
  index: number;
}

/** Find every suspicious segment in `text` — the primitive every Ward below builds on. */
export function detectSuspiciousSegments(text: string): DetectedInjection[] {
  const detections: DetectedInjection[] = [];
  const lower = text.toLowerCase();

  for (const phrase of INJECTION_MARKER_PHRASES) {
    const index = lower.indexOf(phrase);
    if (index !== -1) {
      detections.push({
        segment: text.slice(index, index + phrase.length),
        reason: "marker-phrase",
        index,
      });
    }
  }

  for (const match of text.matchAll(EMBEDDED_BLOCK_PATTERN)) {
    detections.push({ segment: match[0], reason: "embedded-block", index: match.index ?? 0 });
  }

  return detections.sort((a, b) => a.index - b.index);
}

/**
 * Remove every detected segment from `text`, collapsing the resulting
 * whitespace. Detections can overlap (a marker phrase quoted inside an
 * embedded block matches both patterns) — this merges overlapping/contained
 * index ranges into single stretches and cuts each exactly once, rather than
 * doing sequential string search-and-replace, which would silently fail to
 * find a segment whose text an earlier replacement already partially removed.
 */
export function stripSuspiciousSegments(
  text: string,
  detections: readonly DetectedInjection[],
): string {
  const ranges = detections
    .map((detection) => ({ start: detection.index, end: detection.index + detection.segment.length }))
    .sort((a, b) => a.start - b.start);

  const merged: { start: number; end: number }[] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  let result = "";
  let cursor = 0;
  for (const range of merged) {
    result += text.slice(cursor, range.start);
    cursor = range.end;
  }
  result += text.slice(cursor);

  return result.replace(/\s{2,}/g, " ").trim();
}

export interface WardResult {
  /** Text safe to hand to the familiar, after this Ward's action. */
  sanitizedText: string;
  detections: DetectedInjection[];
  /** Whether an injection attempt was found at all, regardless of what this Ward did about it. */
  injectionDetected: boolean;
}

function baseWardResult(text: string): WardResult {
  const detections = detectSuspiciousSegments(text);
  return {
    sanitizedText: stripSuspiciousSegments(text, detections),
    detections,
    injectionDetected: detections.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Rogue — Smoke Ward
// ---------------------------------------------------------------------------

/**
 * Smoke Ward: "cheap and fast ... minimal mana for a quick 'disregard
 * embedded text' instruction" (design doc). Mechanically the plainest
 * Ward — just the shared detector, no extra reasoning/cross-check/context
 * layered on, matching Rogue's speed-over-depth identity.
 */
export function castSmokeWard(text: string): WardResult {
  return baseWardResult(text);
}

// ---------------------------------------------------------------------------
// Knight — Shield Wall
// ---------------------------------------------------------------------------

/**
 * Shield Wall's stance state — "baked into the Guard stance itself rather
 * than a separate cast," persistent across turns, extendable to one ally
 * (design doc). Modeled as a small state object rather than a one-shot
 * function like the other six Wards, since it's explicitly not a
 * per-turn cast.
 */
export interface ShieldWallState {
  active: boolean;
  /** The ally id whose next cast is also protected, if extended. `null` = protecting only the Knight. */
  extendedToAllyId: string | null;
}

export function activateShieldWall(): ShieldWallState {
  return { active: true, extendedToAllyId: null };
}

export function deactivateShieldWall(): ShieldWallState {
  return { active: false, extendedToAllyId: null };
}

/** Extend an already-active Guard stance to protect one ally's next cast too. */
export function extendShieldWallToAlly(state: ShieldWallState, allyId: string): ShieldWallState {
  if (!state.active) return state;
  return { ...state, extendedToAllyId: allyId };
}

/** Whether Shield Wall currently protects `actorId`'s cast (the Knight itself, or its one extended ally). */
export function isProtectedByShieldWall(
  state: ShieldWallState,
  actorId: string,
  knightId: string,
): boolean {
  return state.active && (actorId === knightId || actorId === state.extendedToAllyId);
}

/**
 * Cast the actual injection defense for whoever Shield Wall currently
 * protects. Returns `null` if `actorId` isn't covered (stance inactive, or
 * this actor is neither the Knight nor the extended ally) — callers should
 * fall back to no protection in that case.
 */
export function castShieldWall(
  state: ShieldWallState,
  actorId: string,
  knightId: string,
  text: string,
): WardResult | null {
  if (!isProtectedByShieldWall(state, actorId, knightId)) return null;
  return baseWardResult(text);
}

// ---------------------------------------------------------------------------
// Wizard — Ward of Clarity
// ---------------------------------------------------------------------------

/**
 * Longer-lasting than a single cast (design doc: "stronger and
 * longer-lasting, matching Wizard's deliberate depth") — no exact turn count
 * is given, so this is an isolated, documented placeholder like this
 * module's other provisional constants.
 */
export const WARD_OF_CLARITY_DURATION_TURNS = 3;

export interface WardOfClarityResult extends WardResult {
  /** The extended-thinking "why untrustworthy" trace for each detection — never shown to the familiar. */
  reasoning: string[];
  turnsRemaining: number;
}

function explainDetection(detection: DetectedInjection): string {
  return detection.reason === "marker-phrase"
    ? `"${detection.segment}" matches a known instruction-override phrase — treating it as an attempt to redirect the familiar rather than genuine puzzle content.`
    : `The block ${JSON.stringify(detection.segment)} is explicitly delimited as foreign/embedded text, not the puzzle's own voice — discarding it regardless of content.`;
}

/**
 * Ward of Clarity: "an extended-thinking cast that reasons through *why* the
 * embedded text is untrustworthy before discarding it" (design doc). Same
 * detector as every other Ward, but pairs each detection with a reasoning
 * trace and persists longer (`WARD_OF_CLARITY_DURATION_TURNS`) than a single
 * cast's worth of protection.
 */
export function castWardOfClarity(text: string): WardOfClarityResult {
  const base = baseWardResult(text);
  return {
    ...base,
    reasoning: base.detections.map(explainDetection),
    turnsRemaining: WARD_OF_CLARITY_DURATION_TURNS,
  };
}

// ---------------------------------------------------------------------------
// Bard — Counter-Chorus
// ---------------------------------------------------------------------------

export interface CounterChorusResult extends WardResult {
  /** Whether the ensemble's cross-check revealed an injection attempt to the whole party, not just Bard. */
  revealedToParty: boolean;
}

/**
 * Counter-Chorus: "the ensemble cross-checks itself for injected content,
 * which doubles as detection ... often reveals that an injection was
 * attempted at all, even before it lands" (design doc). The reveal is just
 * `injectionDetected` surfaced under a party-facing name — the mechanical
 * novelty here isn't a stronger detector, it's that detection itself is
 * shared party-wide rather than staying private to the caster.
 */
export function castCounterChorus(text: string): CounterChorusResult {
  const base = baseWardResult(text);
  return { ...base, revealedToParty: base.injectionDetected };
}

// ---------------------------------------------------------------------------
// Cleric — Sealed Scripture
// ---------------------------------------------------------------------------

export interface SealedScriptureResult extends WardResult {
  /** Sentences present in `text` but not corroborated by the Cleric's own retrieved context — treated as "unverified scripture." */
  unverifiedSegments: string[];
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

/**
 * Sealed Scripture: "treats the puzzle text as 'unverified scripture'
 * against the Cleric's own retrieved context" (design doc). On top of the
 * shared marker detector, this strips any sentence from `text` that the
 * Cleric's `trustedContext` (its own "prayer book," `classes.ts`'s Cleric
 * flavor) doesn't corroborate — matching the class's retrieval identity
 * rather than a generic pattern match.
 */
export function castSealedScripture(text: string, trustedContext: string): SealedScriptureResult {
  const base = baseWardResult(text);
  const normalizedContext = trustedContext.toLowerCase();

  const unverifiedSegments = splitIntoSentences(text).filter(
    (sentence) => !normalizedContext.includes(sentence.toLowerCase()),
  );

  let sanitizedText = base.sanitizedText;
  for (const sentence of unverifiedSegments) {
    sanitizedText = sanitizedText.split(sentence).join(" ");
  }
  sanitizedText = sanitizedText.replace(/\s{2,}/g, " ").trim();

  return {
    sanitizedText,
    detections: base.detections,
    injectionDetected: base.injectionDetected || unverifiedSegments.length > 0,
    unverifiedSegments,
  };
}

// ---------------------------------------------------------------------------
// Hunter — Trap Sense
// ---------------------------------------------------------------------------

/**
 * "A chance to reflect the injection back at the enemy" (design doc) — no
 * exact number given, isolated/documented the same way as this file's other
 * provisional constants (e.g. `WARD_OF_CLARITY_DURATION_TURNS` above).
 */
export const TRAP_SENSE_REFLECT_CHANCE = 0.25;

export interface TrapSenseResult extends WardResult {
  /** Whether this cast reflected a detected injection back at the enemy. Only possible when something was actually detected. */
  reflected: boolean;
}

/**
 * Trap Sense: "a lightweight tool-assisted check that flags suspicious
 * embedded strings before casting, with a chance to reflect the injection
 * back at the enemy" (design doc). `rng` injectable for deterministic tests,
 * same pattern as `resolve.ts`'s `rollCrit`.
 */
export function castTrapSense(text: string, rng: () => number = Math.random): TrapSenseResult {
  const base = baseWardResult(text);
  const reflected = base.injectionDetected && rng() < TRAP_SENSE_REFLECT_CHANCE;
  return { ...base, reflected };
}

// ---------------------------------------------------------------------------
// Monk — Empty Mind
// ---------------------------------------------------------------------------

export interface EmptyMindResult {
  /** Only the literal puzzle statement survives — everything else is discarded, unconditionally. */
  sanitizedText: string;
  /**
   * Always `true` — Empty Mind doesn't distinguish "was this actually an
   * injection" from "was this legitimate context I needed." It discards
   * everything beyond the literal statement either way. That's the
   * double-edge the design doc calls out: free and simplest-possible, but
   * it can throw away context a puzzle genuinely needed.
   */
  discardedEverythingElse: true;
}

/**
 * Empty Mind: "free ... and the simplest possible ward — refuses to engage
 * with anything beyond the literal puzzle statement. Double-edged: it also
 * ignores legitimate context the puzzle might have needed" (design doc).
 * Unlike every other Ward, this takes no detector pass at all — the caller
 * is expected to have already separated out "the literal puzzle statement"
 * from everything else (embedded text, legitimate context alike); Empty Mind
 * just discards the rest unconditionally.
 */
export function castEmptyMind(literalPuzzleStatement: string): EmptyMindResult {
  return { sanitizedText: literalPuzzleStatement.trim(), discardedEverythingElse: true };
}

// ---------------------------------------------------------------------------
// Monk's crit-cleanse hook (§5.2) — not tied to the skill tree
// ---------------------------------------------------------------------------

/**
 * "Monk crit while casting Empty Mind removes a random status effect from
 * the whole party" (`prompt-quest-full-spec.md` §5.2). This is called out in
 * the spec as explicitly *not* a skill-tree node — it's a standing hook off
 * the Ward itself, independent of issue #8 (Class Skill Trees, still open).
 *
 * This function implements the *effect* once triggered; detecting the
 * trigger itself (`isCrit && wardCast === "Empty Mind"`) is a future combat
 * loop's job, the same "no live battle loop yet" scope limit as the rest of
 * this module — a caller wires `getCritChance`'s Monk crit roll together
 * with this once that loop exists.
 *
 * Takes each party member's current status effects as a plain array of
 * per-member effect lists (no party/battle-state shape exists yet to bind
 * this to more concretely) and removes exactly one effect, chosen uniformly
 * at random across the *whole party* (not per-member) — a no-op if nobody
 * has any active effects. `rng` injectable for deterministic tests.
 */
export function cleansePartyRandomStatusEffect(
  partyEffects: readonly (readonly StatusEffectInstance[])[],
  rng: () => number = Math.random,
): StatusEffectInstance[][] {
  const flatIndex: { memberIndex: number; effectIndex: number }[] = [];
  partyEffects.forEach((effects, memberIndex) => {
    effects.forEach((_, effectIndex) => flatIndex.push({ memberIndex, effectIndex }));
  });

  if (flatIndex.length === 0) {
    return partyEffects.map((effects) => [...effects]);
  }

  const pick = flatIndex[Math.floor(rng() * flatIndex.length)];
  return partyEffects.map((effects, memberIndex) =>
    memberIndex === pick.memberIndex
      ? effects.filter((_, effectIndex) => effectIndex !== pick.effectIndex)
      : [...effects],
  );
}
