# ADR 0007: The Convocation

## Status

Accepted for issue #10.

## Context

The Convocation is the fixed onboarding gauntlet after character creation. It
needs to be playable before the later multi-actor battle loop exists, but it
must still exercise the real cast, judge, hit/miss/fail, and XP paths so the
onboarding funnel can calibrate against the same mechanics as later fights.

## Decision

`src/lib/convocation/stops.ts` owns the eight hand-authored stops. Each stop
stores its map position, hidden family tag, bound familiar/class metadata,
probe reveal copy, and a `Puzzle` consumed by the existing familiar and judge
pipeline. Stops 1-7 are diagnostic stops; stop 8 is intentionally universal
and teaches a generic Ward framing for adversarial text.

The `/api/convocation/cast` route runs exactly one cast for a stop: player
prompt to familiar, familiar output to Judge, Judge score to the shared
hit/miss/fail resolver, and prompt/elegance metrics to the real XP helpers.
The client records only the resulting XP and stop completion in local storage.

The UI keeps the family tag hidden by default. The Probe action reveals only a
partial family hint, not the full mechanical tag, matching the onboarding
intent that players infer what kind of prompt is needed without seeing the
type-chart label up front.

## Consequences

Convocation XP is banked in Convocation progress for now. Later character
state work can consume or migrate that value, but #10 does not invent a new
character-level persistence model.

The encounter is intentionally a modal over the existing tutorial-zone map so
the map/progress flow stays compact and reuses the asset conventions from the
shared asset system.
