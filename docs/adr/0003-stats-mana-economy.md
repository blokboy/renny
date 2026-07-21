# ADR 0003: Stats & Mana Economy mechanics

## Status

Accepted.

## Context

Issue #5 ("Stats & Mana Economy") owns mechanizing the 5 stats
`prompt-quest-full-spec.md` §5.3 defines (STR/INT/WIS/SPD/LCK) and the
baseline mana cost model §5.1 defines, both of which issue #3 (Character
Creation, ADR 0002) shipped as isolated, documented placeholders rather than
blocking on.

None of the five stat effects, or the mana-cost-through-the-type-chart-divisor
wiring, have an exact formula in the design docs — §9 explicitly calls exact
numeric tuning an open item. This ADR follows the precedent ADR 0001/0002 and
`resolve.ts`'s hit/miss/fail thresholds set: pick clearly-isolated, documented
constants rather than blocking on playtesting data that doesn't exist yet.

There is no live battle-state system (current mana as opposed to max, a
multi-actor turn loop) or Puzzle-Master generator in this repo — those are
out of scope here, same as they were out of scope for #6 (type-chart) and #4
(cast-and-judge pipeline). This issue mechanizes each stat as a pure,
correct, documented function, ready for a future combat loop to call —
it does not build that loop.

## Decision

### Stat storage and growth

`CharacterStats`/`CharacterRecord` (types.ts) are unchanged in shape — a
character's stats were already stored per-character since #3. What's new is
`starting-stats.ts`'s `getStatsAtLevel(classId, level)`: a **pure** function
of (class, level), not an incremental mutator. `STAT_GROWTH_PER_LEVEL` is a
fractional per-level table mirroring each class's `STARTING_STATS` emphasis
(a class's highest starting stats also grow fastest). Recomputing from
`STARTING_STATS` on every call and rounding once avoids the rounding-drift
bug an incremental `applyLevelUp(current, ...)` mutator would have: a
0.2/level growth rate, rounded on every single-level call, would round to 0
forever and the stat would never move. Issue #9's leveling engine is expected
to call `getStatsAtLevel(classId, newLevel)` and re-save the result whenever
level changes, rather than accumulate an incremental delta itself.

### STR — damage multiplier

`resolve.ts`'s `resolveOutcome` gained an `str` parameter:
`strMultiplier = str / STR_DAMAGE_REFERENCE` (`STR_DAMAGE_REFERENCE = 10`,
the rough average Level-1 STR across the 7 classes), applied only to the
"hit" branch. Backfire ("fail") damage is deliberately left unscaled — it's
self-inflicted, not damage *dealt*, and STR is specifically the
damage-*dealt* stat per §5.3. `str` defaults to `STR_DAMAGE_REFERENCE` (a
neutral ×1) so existing callers without a caster's stats in hand are
unaffected.

### INT — token budget

New `tokens.ts`: `estimateTokens` (a documented chars/4 heuristic — no real
tokenizer dependency taken on for this), and `getTokenBudget(int) = int *
40`. 40 tokens/point was chosen so Level-1 Monk (int 6, 240 tokens) stays
meaningfully tighter than Level-1 Wizard (int 18, 720 tokens) while both
land in a "real prompt" range rather than a handful of words. Wired into
`/api/cast` as a 400 rejection when a `casterStats` is present in the
request and the prompt exceeds budget.

### WIS — mana pool

Unchanged mechanically from #3's `getStartingMana` (`40 + wis * 5`) — already
correctly WIS-driven, just no longer a "placeholder pending #5" once this
issue's decision to keep it stands. Reused as-is for leveled-up pools via
`getStatsAtLevel`'s output (no separate "mana at level" function needed,
since `getStartingMana` takes any `CharacterStats`, not just Level-1 ones).

### SPD — turn order

New `src/lib/combat/turnOrder.ts`: `getTurnOrder(combatants)`, a stable sort
descending by SPD (ties keep original relative order — deterministic, no
random tiebreak). No multi-actor battle loop exists to call this yet
(party/dungeon combat is explicitly pass-2, §6) — ships as a pure utility the
same way `typeChart.ts` (#6) shipped unwired.

### LCK — crit chance

New `resolve.ts` export `rollCrit(score, lck, rng?)`, kept separate from
`resolveOutcome` so the random roll (and its `rng` override) doesn't taint
resolution's otherwise-pure damage math. Only scores ≥ `NEAR_PERFECT_SCORE`
(0.9) can crit at all, matching the design doc's "crit for near-perfect"
framing (`prompt-quest-design-doc.md` §3) — this is a *different* mechanic
from Monk's own puzzle-family crit table (`typeChart.ts`'s `getCritChance`,
§7), so the new function is deliberately **not** named `getCritChance` to
avoid the two ever being confused at an import/call site. Crit chance is
`min(0.5, lck / 40)`; a crit doubles hit damage
(`CRIT_DAMAGE_MULTIPLIER = 2`).

### Mana cost through the type-chart divisor

`mana.ts` gained `getCastManaCost(maxMana, model, classId, primaryFamilyTag,
secondaryFamilyTag?, opts?)`, which computes the same baseline
`resolveSpellCost` already did (10% of max mana × the spell's surcharge/
discount multiplier from `classes.ts`) and runs it through
`typeChart.ts`'s existing `getEffectiveCost` (`effective cost = baseline ÷
divisor`) for non-Monk classes. `resolveSpellCost`/`formatSpellCost` are
kept unchanged and still used by the creation screen (`ClassPicker`), which
has no puzzle/family in play yet to divide by — `getCastManaCost` is the
in-combat equivalent, for once a puzzle's family tag is known. Two edge
cases (Monk casts, and `getEffectiveCost`'s own `excluded-same-class-pair`
result) charge baseline with no divisor rather than guessing an undefined
resolution.

## Consequences

- Every stat now does something real and testable; none are silent no-ops.
- `getStatsAtLevel`, `getCastManaCost`, `getTurnOrder`, and `rollCrit` are
  all pure functions independent of any not-yet-built battle-state/party
  system, so they're ready for that system to call without redesign.
- `/api/cast` and its debug page now optionally read the locally-stored
  character and thread its stats through INT/STR/LCK — the first place any
  of these mechanics are actually exercised end-to-end, even without a full
  combat loop.
- `STAT_GROWTH_PER_LEVEL`, `STR_DAMAGE_REFERENCE`,
  `INT_TOKEN_BUDGET_PER_POINT`, `LCK_CRIT_REFERENCE`, and
  `CRIT_DAMAGE_MULTIPLIER` are all explicitly open to playtesting-driven
  retuning (§9) — each isolated in one place for a one-file retune, per the
  established precedent.

## Alternatives considered

- **Incremental `applyLevelUp(current, classId)` mutator** for stat growth —
  rejected: rounding a small fractional per-level increment on every
  single-level call loses fractions (or double-counts them, depending on
  call cadence). A pure `getStatsAtLevel(classId, level)` recomputed from
  scratch avoids the whole class of bug.
- **A real tokenizer dependency** for INT's token-budget check — rejected as
  unnecessary weight for gating prompt length; a documented heuristic is
  sufficient and easy to swap later.
- **Building a mana-deduction/battle-state manager** to make "mana is
  charged per cast" literal — rejected as out of scope; no live combat loop
  exists yet to hold that state (see #6's own precedent, which shipped its
  divisor engine the same way, unwired).
