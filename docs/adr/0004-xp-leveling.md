# ADR 0004: XP & Leveling

## Status

Accepted.

## Context

Issue #9 ("XP & Leveling") asks for characters to earn XP from judged casts
(scaled by Economy and Elegance bonuses), level up along
`prompt-quest-full-spec.md` §3's power curve, and — as a calibration check —
land at exactly Level 10 by the time the onboarding funnel (the Convocation
+ Threshold Guardian) completes.

Three real gaps existed against this issue at implementation time:

1. **The Judge only returned a boolean `elegant` flag**, not the continuous
   0-1 elegance score the Elegance bonus formula (§3) needs. `JudgeResult`
   and `judge.ts`'s schema/prompt are updated in this issue to return
   `elegance: number` instead — the score is the Judge's read on how
   minimal/precise the *player's prompt* was, not a rating of its own
   output.
2. **No Puzzle-Master generator exists yet** (out of scope; MVP hardcodes
   `DEMO_PUZZLE`), so there's no per-puzzle `expectedTokens` estimate for
   the Economy bonus to divide against. `Puzzle` gained an `expectedTokens`
   field, hand-authored on `DEMO_PUZZLE` the same way issue #4 hand-picked
   its hit/miss/fail thresholds.
3. **The actual onboarding funnel doesn't exist yet either** — the
   Convocation (#10) and both Threshold Guardian phases (#11/#12) are still
   open, blocked on this issue and #7/#8. A literal end-to-end playthrough
   calibration isn't runnable. The calibration check is a simulation
   instead (see below), to be replaced by real per-encounter tuning once
   those issues land.

Issue #4 set the precedent this ADR follows for all three gaps: pick
clearly-isolated, documented placeholder constants rather than blocking on
the owning issue or guessing silently inline. Issue #5 ("Stats & Mana
Economy") was implemented in parallel with this issue and owns the actual
per-class stat-growth table; see the integration seam below.

## Decision

### XP curve (`src/lib/xp/curve.ts`)

`XP_to_next(level) = round(50 × level^1.5)` — `50` is the spec's own base
constant, not a placeholder. `getCumulativeXpToLevel(n)` sums the curve from
Level 1 to `n`; `getCumulativeXpToLevel(10) ≈ 5552`, matching the spec's own
"≈5,550" figure.

### Economy/Elegance bonuses (`src/lib/xp/bonuses.ts`)

Implements the spec's formulas verbatim:

```
economyBonus  = clamp(50% × (1 − actualTokens / expectedTokens), 0%, 50%)
eleganceBonus = clamp(eleganceScore, 0%, 1%) × 50%
xpMultiplier  = 1 + economyBonus + eleganceBonus   // stacks additively
```

`actualTokens` is estimated with a placeholder chars/4 heuristic
(`src/lib/xp/tokens.ts`) — not tied to any real model's tokenizer, isolated
so it's a one-file swap later. Issue #5 may independently add its own
INT/token-budget heuristic for a different purpose (capping prompt length);
reconciling the two into one shared utility is a follow-up, not something
either issue blocked on.

### Level/XP state and the stat-growth integration seam (`src/lib/xp/leveling.ts`)

`CharacterRecord` gained `level`/`xp` fields (starting at `1`/`0` on
creation in `CreationWizard`). `applyXpGain(state, xpGained, classId,
stats)` runs the level-up loop — a single large XP grant can cross multiple
level thresholds in one call, satisfying "stat increments apply on every
level-up, not just tier-band boundaries."

Each level-up calls `applyLevelUp(stats, classId)`, which issue #5 owns the
real implementation of (per-class stat growth). Issue #5 was implemented in
parallel on a separate branch, so this issue ships a trivial stub (+1 flat
to all 5 stats, marked `TODO(#5)`) so the level-up loop compiles and is
testable today. Wiring the real growth table in is a same-shape swap, not a
redesign, once both branches merge.

### Calibration check (`src/lib/xp/calibration.ts`, `/debug/xp`)

Since the real onboarding funnel doesn't exist yet, `runCalibration()`
simulates `ONBOARDING_CAST_COUNT = 10` judged casts with a hand-authored,
varying-but-25%/25%-averaging sequence of Economy/Elegance bonuses (some
casts tight and elegant, some loose and wordy — not a flat average every
time, to prove the curve converges under realistic variance).
`BASE_XP_PER_CAST = 371` is fit so 10 casts averaging a 1.5× multiplier
(25% + 25%) sum to slightly over the ≈5552 XP target, rounded *up* from the
exact fit (370.1) rather than to-nearest so the unevenly-distributed
simulation still clears Level 10 on the last cast rather than falling just
short on rounding alone. Running the simulation lands the synthetic
character at exactly Level 10 with 14 XP to spare.

`/debug/xp` (matching the `/debug/cast` and `/debug/type-chart` debug-page
convention from issues #4 and #6) renders the curve, a live per-cast XP
calculator, and the calibration table.

## Consequences

- `BASE_XP_PER_CAST`, the token-estimation heuristic, and `expectedTokens`
  on `DEMO_PUZZLE` are all expected to be replaced once real puzzles and
  playtesting data exist — same as issue #4's thresholds and issue #3's
  starting-stats placeholders were always expected to be replaced.
- `applyLevelUp`'s stub growth (+1 to all 5 stats) is expected to be
  replaced entirely by issue #5's real per-class growth table; nothing else
  in `src/lib/xp/` should need to change when that happens.
- The Judge's `elegant: boolean` → `elegance: number` change is a breaking
  change to `JudgeResult`; the one caller that rendered it (`/debug/cast`)
  is updated in this issue.

## Alternatives considered

- **Blocking the calibration check on #10/#11/#12** — rejected per the
  issue's own guidance and the #4/#5 precedent; a documented simulation is
  cheap to replace with real encounter data later and unblocks #9 today.
- **Sharing one token-estimation utility with #5 from the start** —
  rejected: #5 was being implemented in parallel on a separate branch with
  no shared coordination point mid-flight. Two small, independently
  documented heuristics are an easy post-merge dedupe; blocking either
  issue on the other to share one file isn't worth it for a rough
  chars/4 estimate.
