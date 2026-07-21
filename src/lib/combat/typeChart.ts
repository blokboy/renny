/**
 * Puzzle Taxonomy & Type-Chart Engine (issue #6).
 *
 * Pure lookup/calculation engine: given a class and a puzzle's family tag(s),
 * returns the effective mana-cost divisor (non-Monk classes) or crit chance
 * (Monk). No LLM calls, no puzzle generation — that's the Puzzle-Master, a
 * separate future system. See `prompt-quest-design-doc.md` §5/§7 and
 * `prompt-quest-full-spec.md` §1 for the source numbers.
 */

// ---------------------------------------------------------------------------
// Puzzle families — closed enum
// ---------------------------------------------------------------------------

/**
 * All 12 puzzle families, in the order they're introduced in the design docs
 * (11 from the original taxonomy + Reverse-prompt as the 12th, added in
 * `prompt-quest-full-spec.md` §1).
 */
export const PUZZLE_FAMILIES = [
  "Transformation",
  "Constraint-satisfaction golf",
  "Format gauntlet",
  "Adversarial-text-injection",
  "Blind relay",
  "Multi-hop state tracking",
  "Self-consistency traps",
  "Simulation-execution",
  "Interrogation",
  "Steganography-extraction",
  "Ambiguity resolution",
  "Reverse-prompt",
] as const;

export type PuzzleFamily = (typeof PUZZLE_FAMILIES)[number];

/**
 * Safe default for a malformed/hallucinated family tag — per the "Puzzle-
 * family tagging" subsection of the design doc (§7): reject any value outside
 * the known set and snap to this, the flattest/most neutral entry, rather
 * than letting the encounter crash.
 */
export const DEFAULT_FAMILY: PuzzleFamily = "Ambiguity resolution";

function isKnownFamily(value: string): value is PuzzleFamily {
  return (PUZZLE_FAMILIES as readonly string[]).includes(value);
}

/**
 * Validate/normalize a (possibly hallucinated) family tag against the closed
 * enum. Never throws — an invalid tag snaps to `DEFAULT_FAMILY` and is
 * flagged via `wasInvalid` so callers/UI can surface that it happened.
 */
export function normalizeFamily(tag: string | null | undefined): {
  family: PuzzleFamily;
  wasInvalid: boolean;
} {
  if (tag != null && isKnownFamily(tag)) {
    return { family: tag, wasInvalid: false };
  }
  return { family: DEFAULT_FAMILY, wasInvalid: true };
}

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export const NON_MONK_CLASSES = [
  "Rogue",
  "Knight",
  "Wizard",
  "Bard",
  "Cleric",
  "Hunter",
] as const;

export type NonMonkClass = (typeof NON_MONK_CLASSES)[number];

export const CLASSES = [...NON_MONK_CLASSES, "Monk"] as const;
export type ClassName = (typeof CLASSES)[number];

// ---------------------------------------------------------------------------
// The divisor chart — §7, plus the Reverse-prompt column from the full spec §1
// ---------------------------------------------------------------------------

type DivisorRow = Record<PuzzleFamily, number>;

const DIVISOR_CHART: Record<NonMonkClass, DivisorRow> = {
  Rogue: {
    Transformation: 1.5,
    "Constraint-satisfaction golf": 1,
    "Format gauntlet": 2.0,
    "Adversarial-text-injection": 1,
    "Blind relay": 1,
    "Multi-hop state tracking": 0.5,
    "Self-consistency traps": 1,
    "Simulation-execution": 0.5,
    Interrogation: 1,
    "Steganography-extraction": 1,
    "Ambiguity resolution": 0.75,
    "Reverse-prompt": 0.75,
  },
  Knight: {
    Transformation: 1,
    "Constraint-satisfaction golf": 1.5,
    "Format gauntlet": 1,
    "Adversarial-text-injection": 1.5,
    "Blind relay": 1,
    "Multi-hop state tracking": 1,
    "Self-consistency traps": 1,
    "Simulation-execution": 1,
    Interrogation: 1,
    "Steganography-extraction": 1,
    "Ambiguity resolution": 1,
    "Reverse-prompt": 1,
  },
  Wizard: {
    Transformation: 2.0,
    "Constraint-satisfaction golf": 1,
    "Format gauntlet": 0.5,
    "Adversarial-text-injection": 1,
    "Blind relay": 0.5,
    "Multi-hop state tracking": 2.0,
    "Self-consistency traps": 1.5,
    "Simulation-execution": 1,
    Interrogation: 1,
    "Steganography-extraction": 1,
    "Ambiguity resolution": 1,
    "Reverse-prompt": 2.0,
  },
  Bard: {
    Transformation: 1,
    "Constraint-satisfaction golf": 1,
    "Format gauntlet": 0.5,
    "Adversarial-text-injection": 1,
    "Blind relay": 1,
    "Multi-hop state tracking": 0.75,
    "Self-consistency traps": 2.0,
    "Simulation-execution": 1,
    Interrogation: 1.5,
    "Steganography-extraction": 1,
    "Ambiguity resolution": 1,
    "Reverse-prompt": 1,
  },
  Cleric: {
    Transformation: 1,
    "Constraint-satisfaction golf": 0.75,
    "Format gauntlet": 1,
    "Adversarial-text-injection": 0.75,
    "Blind relay": 1,
    "Multi-hop state tracking": 1.5,
    "Self-consistency traps": 1,
    "Simulation-execution": 1,
    Interrogation: 1,
    "Steganography-extraction": 2.0,
    "Ambiguity resolution": 1,
    "Reverse-prompt": 1,
  },
  Hunter: {
    Transformation: 1.5,
    "Constraint-satisfaction golf": 1,
    "Format gauntlet": 1,
    "Adversarial-text-injection": 1,
    "Blind relay": 1,
    "Multi-hop state tracking": 1,
    "Self-consistency traps": 1,
    "Simulation-execution": 2.0,
    Interrogation: 0.5,
    "Steganography-extraction": 1,
    "Ambiguity resolution": 0.75,
    "Reverse-prompt": 1,
  },
};

/** STAB bonus added to a single family's divisor (§7: "+0.25"). */
const STAB_DIVISOR_BONUS = 0.25;

// ---------------------------------------------------------------------------
// Monk's crit-chance table — the "Monk exception" (§7), plus Reverse-prompt
// row from the full spec §1.
// ---------------------------------------------------------------------------

const MONK_CRIT_TABLE: Record<PuzzleFamily, number> = {
  Transformation: 15,
  "Constraint-satisfaction golf": 15,
  "Format gauntlet": 15,
  "Adversarial-text-injection": 15,
  "Blind relay": 50,
  "Multi-hop state tracking": 0,
  "Self-consistency traps": 15,
  "Simulation-execution": 0,
  Interrogation: 15,
  "Steganography-extraction": 8,
  "Ambiguity resolution": 30,
  "Reverse-prompt": 15,
};

/** STAB bonus for Monk: flat +10 percentage points, not a divisor shift. */
const MONK_STAB_CRIT_BONUS = 10;

/** Base crit damage multiplier; Empty Fist bumps this to ×3 (same table). */
const BASE_CRIT_MULTIPLIER = 2;
const EMPTY_FIST_CRIT_MULTIPLIER = 3;

// ---------------------------------------------------------------------------
// Same-class stacking exclusion
// ---------------------------------------------------------------------------

/**
 * A class's own "defining win condition" families — the ones where its
 * divisor is 2.0 (§7's outliers, e.g. Wizard has three: Transformation,
 * Multi-hop state tracking, Reverse-prompt).
 */
function get2xFamilies(className: NonMonkClass): PuzzleFamily[] {
  const row = DIVISOR_CHART[className];
  return PUZZLE_FAMILIES.filter((family) => row[family] === 2.0);
}

/** A class's own "resisted matchup" families — divisor below 1. */
function getSubOneFamilies(className: NonMonkClass): PuzzleFamily[] {
  const row = DIVISOR_CHART[className];
  return PUZZLE_FAMILIES.filter((family) => row[family] < 1);
}

/**
 * Same-class stacking exclusion rule (issue #6 acceptance criteria):
 * "Dual-typed bosses multiply two divisors together, except pairings are
 * excluded where both families are the same class's two 2.0s or same
 * class's two sub-1 penalties."
 *
 * This is a per-class check — the same family pair might be valid for one
 * class and excluded for another, since divisor values differ by class.
 */
export function isExcludedFamilyPair(
  className: NonMonkClass,
  familyA: PuzzleFamily,
  familyB: PuzzleFamily
): boolean {
  const twoXSet = new Set(get2xFamilies(className));
  if (twoXSet.has(familyA) && twoXSet.has(familyB)) return true;

  const subOneSet = new Set(getSubOneFamilies(className));
  if (subOneSet.has(familyA) && subOneSet.has(familyB)) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Shared options
// ---------------------------------------------------------------------------

export interface TypeChartOpts {
  /**
   * Whether the cast was the class's own signature spell landing in its
   * favored family (STAB — "Same Type Attack Bonus").
   *
   * Open spec item: the design docs never define a signature-spell-to-family
   * mapping (only a couple of named examples appear in passing, e.g.
   * Wizard's "Deep Thought" or "Insight Probe"). Rather than invent a full
   * mapping, this engine takes STAB eligibility as an explicit input —
   * the caller (a future combat system, once spell lists are designed)
   * decides eligibility and passes the flag in. Same pattern issue #4 used
   * for its own undocumented hit/miss/fail thresholds (see
   * `src/lib/combat/resolve.ts`): an isolated, documented placeholder, not a
   * blocker for this issue.
   *
   * When a secondary family is present, STAB is applied to the *primary*
   * family's divisor/crit value before combining with the secondary — the
   * docs' only worked example (Wizard's Deep Thought into multi-hop = 2.25)
   * is a single-family case, so this ordering is this engine's own
   * documented choice for the dual-type case, not a value taken from the
   * docs.
   */
  isStabEligible?: boolean;
  /** Base mana cost before the divisor is applied. Defaults to 1. */
  baseCost?: number;
}

// ---------------------------------------------------------------------------
// Non-Monk: getEffectiveCost
// ---------------------------------------------------------------------------

export interface EffectiveCostMeta {
  className: NonMonkClass;
  primaryFamily: PuzzleFamily;
  secondaryFamily: PuzzleFamily | null;
  primaryFamilyWasInvalid: boolean;
  secondaryFamilyWasInvalid: boolean;
  stabApplied: boolean;
}

export type EffectiveCostResult =
  | ({
      ok: true;
      divisor: number;
      baseCost: number;
      effectiveCost: number;
    } & EffectiveCostMeta)
  | ({
      ok: false;
      reason: "excluded-same-class-pair";
      detail: string;
    } & EffectiveCostMeta);

/**
 * Given a (non-Monk) class and a puzzle's family tag(s), returns the
 * effective mana cost. Invalid/hallucinated family tags snap to
 * `DEFAULT_FAMILY` rather than throwing. Dual-type pairs excluded by the
 * same-class stacking rule come back as `ok: false` instead of a computed
 * (nonsensical) divisor — callers decide how to handle that (e.g. re-roll,
 * fall back to single-typed).
 */
export function getEffectiveCost(
  className: NonMonkClass,
  primaryFamilyTag: string,
  secondaryFamilyTag?: string | null,
  opts: TypeChartOpts = {}
): EffectiveCostResult {
  const baseCost = opts.baseCost ?? 1;
  const stabApplied = opts.isStabEligible ?? false;

  const { family: primaryFamily, wasInvalid: primaryFamilyWasInvalid } =
    normalizeFamily(primaryFamilyTag);
  const { family: secondaryFamily, wasInvalid: secondaryFamilyWasInvalid } =
    secondaryFamilyTag != null && secondaryFamilyTag !== ""
      ? normalizeFamily(secondaryFamilyTag)
      : { family: null as PuzzleFamily | null, wasInvalid: false };

  const meta: EffectiveCostMeta = {
    className,
    primaryFamily,
    secondaryFamily,
    primaryFamilyWasInvalid,
    secondaryFamilyWasInvalid,
    stabApplied,
  };

  if (secondaryFamily && isExcludedFamilyPair(className, primaryFamily, secondaryFamily)) {
    return {
      ok: false,
      reason: "excluded-same-class-pair",
      detail: `${className}'s "${primaryFamily}" and "${secondaryFamily}" are both in the same stacking-excluded set (both 2.0s, or both sub-1 penalties) for this class.`,
      ...meta,
    };
  }

  const row = DIVISOR_CHART[className];
  let divisor = row[primaryFamily];
  if (stabApplied) divisor += STAB_DIVISOR_BONUS;

  if (secondaryFamily) {
    divisor *= row[secondaryFamily];
  }

  const effectiveCost = baseCost / divisor;

  return {
    ok: true,
    divisor,
    baseCost,
    effectiveCost,
    ...meta,
  };
}

// ---------------------------------------------------------------------------
// Monk: getCritChance
// ---------------------------------------------------------------------------

export interface MonkOpts extends TypeChartOpts {
  /**
   * Empty Fist (Monk capstone): a zero-shot cast reusing the same crit
   * table, but at a bumped ×3 damage multiplier instead of the usual ×2.
   */
  isEmptyFist?: boolean;
}

export interface CritChanceResult {
  ok: true;
  className: "Monk";
  primaryFamily: PuzzleFamily;
  secondaryFamily: PuzzleFamily | null;
  primaryFamilyWasInvalid: boolean;
  secondaryFamilyWasInvalid: boolean;
  stabApplied: boolean;
  /**
   * Percentage points (0-100). Intentionally uncapped — per §7, dual-typed
   * bosses average rather than multiply for Monk specifically so numbers
   * don't get crushed, and nothing in the docs caps the result at 100;
   * this engine leaves it as computed rather than clamping.
   */
  critChance: number;
  critMultiplier: number;
}

/**
 * Monk-specific path: no divisor (Monk's casts are already free), so
 * favorability is expressed as crit chance instead. Dual-typed bosses
 * *average* the two family values for Monk (not multiplicative — the design
 * doc calls out that multiplying two probabilities would crush Monk's
 * numbers into irrelevance). The same-class stacking exclusion rule does
 * not apply here: it's specifically about divisor multiplication producing
 * a nonsensical double-2.0/double-penalty stack, which doesn't arise from
 * an average of two percentages.
 */
export function getCritChance(
  primaryFamilyTag: string,
  secondaryFamilyTag?: string | null,
  opts: MonkOpts = {}
): CritChanceResult {
  const stabApplied = opts.isStabEligible ?? false;

  const { family: primaryFamily, wasInvalid: primaryFamilyWasInvalid } =
    normalizeFamily(primaryFamilyTag);
  const { family: secondaryFamily, wasInvalid: secondaryFamilyWasInvalid } =
    secondaryFamilyTag != null && secondaryFamilyTag !== ""
      ? normalizeFamily(secondaryFamilyTag)
      : { family: null as PuzzleFamily | null, wasInvalid: false };

  let critChance = MONK_CRIT_TABLE[primaryFamily];
  if (secondaryFamily) {
    critChance = (critChance + MONK_CRIT_TABLE[secondaryFamily]) / 2;
  }
  if (stabApplied) critChance += MONK_STAB_CRIT_BONUS;

  const critMultiplier = opts.isEmptyFist
    ? EMPTY_FIST_CRIT_MULTIPLIER
    : BASE_CRIT_MULTIPLIER;

  return {
    ok: true,
    className: "Monk",
    primaryFamily,
    secondaryFamily,
    primaryFamilyWasInvalid,
    secondaryFamilyWasInvalid,
    stabApplied,
    critChance,
    critMultiplier,
  };
}

// ---------------------------------------------------------------------------
// Reverse-prompt anti-cheese rubric guard
// ---------------------------------------------------------------------------

/**
 * Reverse-prompt's anti-cheese rule (full spec §1): submitting a prompt that
 * quotes/pastes the target output verbatim (or beyond a small overlap
 * threshold) is a hard zero. This is the Judge's scoring concern, not the
 * divisor/crit engine above — included here only as a small, isolated guard
 * so the rule lives somewhere in this issue's module rather than being lost;
 * a future Judge integration (not built here) is expected to call this
 * before/alongside its normal rubric scoring.
 *
 * `overlapThreshold` is a fraction (0-1) of the target output's length that,
 * if matched as a contiguous substring, counts as "verbatim quoting". Not
 * specified numerically by the docs ("or beyond a small overlap
 * threshold") — left as a parameter for the same reason as STAB eligibility
 * above: a genuine open spec item, not something to guess a hard number for.
 */
export function isReversePromptVerbatimCheese(
  submittedPrompt: string,
  targetOutput: string,
  overlapThreshold = 0.6
): boolean {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const prompt = normalize(submittedPrompt);
  const target = normalize(targetOutput);

  if (target.length === 0) return false;
  if (prompt.includes(target)) return true;

  const minOverlapLen = Math.ceil(target.length * overlapThreshold);
  if (minOverlapLen <= 0 || minOverlapLen > target.length) return false;

  for (let start = 0; start + minOverlapLen <= target.length; start++) {
    const chunk = target.slice(start, start + minOverlapLen);
    if (prompt.includes(chunk)) return true;
  }

  return false;
}
