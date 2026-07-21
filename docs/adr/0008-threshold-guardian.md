# ADR 0008: Threshold Guardian encounter

## Status

Accepted for issue #11.

## Context

The Threshold Guardian is the first generated fight and the first party
convergence puzzle. It must reuse the cast/Judge/resolution and character
systems while keeping the later Interrogation variant isolated to issue #12.
The repo has no server-side session store, so durable game progress still lives
in browser storage.

## Decision

`src/lib/guardian` owns generated encounter definitions and pure battle-state
transitions. A run maps the player's class to its diagnostic family, rolls one
of the three Dependency-Lock families with equal probability, and samples three
distinct NPC classes from the six non-player classes.

`/api/guardian/generate` asks the Puzzle-Master for fresh solo and shield
content. A randomized procedural generator is the availability fallback when
the configured model cannot return valid JSON; it still varies the content per
run and preserves the selected families. The player shard is built only from
the generated NPC output and handoff instruction, making the dependency an
explicit data relationship rather than narrative copy.

`/api/guardian/cast` reuses the familiar, Judge, hit/miss/fail, INT, mana,
crit, and XP modules. The client owns the current fight state, consumes banked
Convocation XP when the class is confirmed, persists character level gains,
and writes a completion marker on victory for the Town Hub gate.

## Consequences

The fight is fully playable without adding a backend session model. Puzzle
rubrics travel to the browser as part of encounter state, matching the existing
Convocation architecture; moving hidden rubrics server-side requires a future
encounter store. Interrogation is deliberately absent from the family roll
until issue #12 implements its multi-question state machine.
