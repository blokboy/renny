# ADR 0006: Status Effects & Wards

## Status

Accepted.

## Context

Issue #7 ("Status Effects & Wards") asks for two independent mechanics to
exist as pure, testable primitives, per `prompt-quest-full-spec.md` §4 (the
duration model) and the design doc's Ward section (flavor for each class's
anti-injection spell, `classes.ts`'s `ward` field — name/description only,
mechanics landing here):

1. Enemy-inflicted status effects: Sleep, Silence, Confusion (1-turn), Mana
   Burn (instant one-time drain), and Poison (2-3 turns, compounding
   severity).
2. All 7 classes' Ward spells, each behaviorally distinct per the design
   doc (lines ~57-65), not a shared generic template.

As with every prior issue in `src/lib/combat` (#4's thresholds, #5's stat
formulas, #6's divisor chart), **no multi-actor battle loop exists yet**
(`CONTEXT.md`) to consume any of this — everything here ships as standalone,
documented, tested functions/types a future combat loop calls without
redesign, following the same precedent.

Two real gaps existed against this issue at implementation time:

1. **No test runner existed in this repo.** No `vitest`/`jest` config, no
   `*.test.ts` files, and no `test` script in `package.json` — every prior
   issue's own "make it correct" bar was manual verification via a `/debug/*`
   page (`/debug/cast`, `/debug/type-chart`, `/debug/xp`). Vitest is added
   (Next.js's own documented unit-test choice) rather than skipping tests or
   inventing an undocumented alternative — see "Test runner" below.
2. **No prompt-injection classifier exists** (no Judge/LLM call is made by
   this module) to actually detect embedded/injected text for the Ward
   mechanics to act on. A small, closed, explicitly-provisional marker-based
   heuristic stands in, the same precedent `typeChart.ts`'s
   `isReversePromptVerbatimCheese` set for its own admittedly-crude
   verbatim-quoting check.

## Decision

### File split

- `src/lib/combat/types.ts` gained `StatusEffectType`, `SpellCategory`, and
  `StatusEffectInstance` — the shared shapes other modules (a future combat
  loop, issue #8's cleanse triggers) will need to reference, matching how
  `ResolvedCast`/`Puzzle` already live in `types.ts` rather than in the files
  that produce them.
- `src/lib/combat/statusEffects.ts` — Sleep/Silence/Confusion/Mana
  Burn/Poison: apply/tick/cleanse/query functions.
- `src/lib/combat/wards.ts` — the shared injection-detection heuristic, plus
  one cast function per class, plus the Monk crit-cleanse hook.

Ward *result* types (`WardResult`, `TrapSenseResult`, etc.) are kept local to
`wards.ts` rather than pushed into `types.ts` — following `typeChart.ts`'s own
precedent of defining its several exported result interfaces locally, since
nothing outside this module needs to name them yet.

### Duration model

Fixed, flat turn counts, **not** scaled by tier or boss level (spec §4's own
explicit call-out: scaling durations would double-punish low-level characters
on top of the puzzle itself getting harder at higher tiers).

- Sleep/Silence/Confusion: `turnsRemaining: 1` on application; skips the
  caster's action, blocks one spell category, and garbles the prompt,
  respectively.
- Mana Burn: **not** a `StatusEffectInstance` at all — `applyManaBurn`
  computes a post-drain mana number directly and returns it, since the spec
  is explicit this is "instant, one-time," not a duration effect. Drain is a
  fraction of *max* mana (`MANA_BURN_DRAIN_FRACTION = 0.15`), mirroring
  `mana.ts`'s `BASELINE_COST_FRACTION` convention (10% of max mana per cast)
  rather than a flat number, so it scales the same way a cast's own cost
  does across levels. No exact number is given in the docs beyond "a direct
  drain" — isolated/documented like `resolve.ts`'s hit/miss/fail thresholds.
- Poison: `turnsRemaining` fixed at 2 or 3 (picked via an injectable `rng`,
  `applyPoison`), never scaled.

### Poison's compounding severity

The one status effect issue #7 calls out as *not* staying flat: `severity`
starts at `POISON_STARTING_SEVERITY = 1` on application and multiplies by
`1 + POISON_SEVERITY_GROWTH_RATE` (`0.1`, i.e. +10%) once per
`tickStatusEffects` call the effect survives — so a 3-turn poison's severity
across its lifetime reads `1 → 1.1 → 1.21`, each turn 10% worse than the
last, exactly matching "compounds 10% per turn it isn't cleansed."

This engine tracks the *number* correctly; it deliberately does **not**
decide how severity gets applied to damage/output (e.g. discounting the
Judge's score, or extra HP loss) — that mapping belongs to whichever future
combat loop consumes it, the same way `resolve.ts` leaves STR's damage
formula isolated from the Judge's own scoring rather than this issue
guessing a cross-system formula. One concrete, optional consumer is shipped
anyway: `degradeTextWithPoison(text, severity, rng)`, matching the design
doc's "the effective prompt or the returned answer degrades a little each
turn it lingers" — it corrupts a fraction of words proportional to
`(severity - 1) × POISON_DEGRADATION_PER_SEVERITY_POINT` (`0.15`), so a
freshly-applied poison (severity 1, hasn't lingered yet) degrades nothing,
and each additional turn it's not cleansed corrupts visibly more.

`cleanseStatusEffect(effects, type)` removes every instance of a type
outright — for Poison specifically, this is what makes cleansing
"meaningfully valuable rather than just wait it out" (issue #7): a
re-applied Poison always restarts at severity 1, never partial credit for
an interrupted compound.

### Cleanse primitives are intentionally unwired

Issue #8 (Class Skill Trees) is still open and explicitly out of scope here.
The §5.2 cleanse-skill table (Cleric/Poison via Shared Scripture, Bard/
Confusion via Chorus of Encouragement, Wizard/Silence via Shared Insight,
Rogue/Mana Burn via Quickdraw, Hunter/Sleep via Share the Kit) is issue #8's
job to trigger — this issue only ships `cleanseStatusEffect` as the one
primitive every one of those triggers will call, so wiring them up later is
"call this function when the skill fires," not a redesign.

### Ward mechanics — one shared detector, seven distinct behaviors

`detectSuspiciousSegments(text)` is a small, closed, explicitly-provisional
heuristic: a list of common instruction-override phrases
(`INJECTION_MARKER_PHRASES`, e.g. "ignore previous instructions") plus a
`<<...>>` delimiter convention standing in for "this text was quoted from
somewhere else, not authored by the puzzle itself." No real classifier/Judge
call exists in this repo to replace it with — same provisional-placeholder
precedent as `typeChart.ts`'s `isReversePromptVerbatimCheese`.
`stripSuspiciousSegments` removes detections by merging their index ranges
(not sequential string search/replace) specifically so overlapping
detections — e.g. a marker phrase quoted *inside* an embedded block matches
both patterns — still strip cleanly in one pass instead of one replacement
silently failing to find text an earlier one already partially removed.

Every class's Ward wraps this one detector so what's actually being
compared across classes is each Ward's own *behavior*, not seven reinvented
detectors:

- **Rogue — Smoke Ward**: the detector alone, nothing else layered on —
  "cheap and fast," the plainest possible Ward.
- **Knight — Shield Wall**: modeled as persistent stance state
  (`ShieldWallState`, `activateShieldWall`/`extendShieldWallToAlly`) rather
  than a one-shot function like the other six — "baked into the Guard
  stance itself rather than a separate cast," extendable to protect one
  ally's next cast. `castShieldWall` returns `null` for an actor the stance
  doesn't currently cover.
- **Wizard — Ward of Clarity**: pairs each detection with a plain-English
  reasoning string (`reasoning: string[]`, the "extended-thinking ... reasons
  through *why*" behavior) and reports a longer
  `turnsRemaining` (`WARD_OF_CLARITY_DURATION_TURNS = 3`, a provisional
  pick — "longer-lasting" is qualitative in the docs, no turn count given)
  than a single cast's worth of protection.
- **Bard — Counter-Chorus**: identical detection, but surfaces
  `revealedToParty` — the design doc's point is the *reveal* being
  party-wide, not a stronger detector.
- **Cleric — Sealed Scripture**: takes a second `trustedContext` argument
  (the Cleric's own "prayer book") and additionally strips any sentence from
  the input the trusted context doesn't corroborate, flagged as
  `unverifiedSegments` — "unverified scripture" made literal.
- **Hunter — Trap Sense**: adds an injectable-`rng` reflect roll
  (`TRAP_SENSE_REFLECT_CHANCE = 0.25`, provisional — "a chance to reflect,"
  no number given), only possible when something was actually detected.
- **Monk — Empty Mind**: takes no detector pass at all —
  `castEmptyMind(literalPuzzleStatement)` keeps only what the caller already
  identified as the literal puzzle statement and discards everything else
  unconditionally, `discardedEverythingElse: true` always. This is the
  double-edge the design doc calls out: Empty Mind can't tell "that was an
  injection" from "that was context the puzzle actually needed" — it
  discards both the same way.

### Monk's crit-cleanse hook (§5.2) — not tied to the skill tree

The spec is explicit this is a standing hook off the Ward itself, independent
of issue #8: "Monk crit while casting Empty Mind removes a random status
effect from the whole party." `cleansePartyRandomStatusEffect(partyEffects,
rng)` in `wards.ts` implements the *effect*: given each party member's
current status effects as a plain array of per-member arrays (no
party/battle-state shape exists yet to bind this to more concretely — same
"no live combat loop" limit as everything else here), it removes exactly one
effect chosen uniformly at random across the *whole party*, or no-ops if
nobody has any. Detecting the trigger itself (`isCrit && wardCast === "Empty
Mind"`) is left to a future combat loop, which already has Monk's own crit
roll available via `typeChart.ts`'s `getCritChance` — this function is ready
for that loop to call the moment it exists, without redesign.

### Test runner

Vitest is added (`vitest.config.mts`, `package.json`'s new `test` script) —
this repo's first automated test suite. Chosen because it's Next.js's own
documented unit-test tool
(`node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`) and every
target here is a pure TS module with no React/DOM surface, so the setup
intentionally skips the guide's `jsdom`/`@vitejs/plugin-react` pieces —
those are one config addition away whenever a future issue needs to unit-test
a component. A `vite-tsconfig-paths` plugin was tried first (to support
`@/*` imports in tests) but dropped: nothing in `src/lib/combat` imports via
the `@/*` alias (this folder's own convention is relative imports —
`resolve.ts`/`puzzles.ts` both import `./types`), and the plugin's default
project-discovery walked the whole machine's filesystem looking for
`tsconfig.json` files, which is unnecessary noise for a folder that doesn't
need it.

## Consequences

- `StatusEffectInstance`/`cleanseStatusEffect` are the two names issue #8's
  skill-tree cleanse triggers are expected to call directly — no new
  primitive should be needed when that issue lands.
- `INJECTION_MARKER_PHRASES`, `WARD_OF_CLARITY_DURATION_TURNS`,
  `TRAP_SENSE_REFLECT_CHANCE`, `MANA_BURN_DRAIN_FRACTION`, and
  `POISON_DEGRADATION_PER_SEVERITY_POINT` are all explicitly open to
  replacement once a real classifier/playtesting data exists, isolated in
  one place each for a one-file retune, per the established precedent.
- `degradeTextWithPoison`/`garblePrompt` are provided as one concrete,
  documented way to apply Poison/Confusion to text, but are optional for a
  future combat loop to call — the compounding `severity` number and the
  1-turn duration are the actual acceptance-criteria contract; how exactly
  they're surfaced to the player is that loop's call.
- This is the first `src/lib` folder in the repo with automated tests
  (`statusEffects.test.ts`, `wards.test.ts`, 38 cases). No existing module
  gained tests retroactively — that's a separate, larger undertaking not in
  this issue's scope.

## Alternatives considered

- **A real spell-category enum for Silence** (tagging every `classes.ts`
  spell with a category) — rejected: out of scope for this issue, which
  isn't touching `classes.ts`'s flavor data, and no combat loop exists yet
  to need more than the one concrete category ("ward") the docs actually
  name. `SpellCategory` stays an open string so a future issue can introduce
  a real taxonomy without this type changing.
- **Sequential string search-and-replace for `stripSuspiciousSegments`** —
  tried first, rejected: it silently fails whenever two detections overlap
  (a marker phrase fully quoted inside an embedded block), since an earlier
  replacement can remove the substring a later one is searching for. Index-
  range merging fixes this in one pass and was verified against exactly that
  overlap case in `wards.test.ts`.
- **Building the Monk crit-cleanse hook against a concrete party/battle-state
  shape** — rejected: no such shape exists in this repo yet (`CONTEXT.md`).
  A plain array-of-arrays keeps the function callable today and reshapable
  later without redesigning its logic.
