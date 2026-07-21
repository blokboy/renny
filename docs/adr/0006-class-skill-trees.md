# ADR 0006: Class Skill Tree Mechanics

## Status

Accepted.

## Context

Issue #8 finalizes all seven class skill trees from
`prompt-quest-full-spec.md` §5. The static character-selection data already
listed most ability names and descriptions, but combat-facing code still
needed stable ids, trigger metadata, structured effects, cleanse assignments,
and castability helpers.

The repo still does not have a full battle-state manager. As with ADR 0003's
stats/mana work, this ADR keeps #8's implementation as pure domain functions
that future combat loops can call without owning turn storage, cooldown state,
or party HP/mana mutation yet.

## Decision

`SpellDef` now carries:

- a stable `SkillId`
- unlock level
- timing (`active`, `passive`, or `triggered`)
- target scope
- trigger list
- typed effect tags

`src/lib/character/classes.ts` remains the source of truth for the 35 class
skills. `src/lib/character/skill-trees.ts` exposes lookup, completeness,
unlock, trigger, mana-cost, and castability helpers around that data.

Knight's documented exception is modeled directly: every Knight skill targets
`party-protective`, including Lv1 `Martyr`.

Cleanse assignments are centralized in `CLEANSE_ASSIGNMENTS`:

- Cleric `Shared Scripture` cleanses Poison from its ally.
- Bard `Chorus of Encouragement` cleanses Confusion party-wide when a trap is
  revealed.
- Wizard `Shared Insight` cleanses Silence party-wide on critical cast.
- Rogue `Quickdraw` cleanses or avoids Mana Burn on the first cast.
- Hunter `Share the Kit` cleanses or prevents Sleep on the recipient.
- Monk `Empty Mind` removes a random party status when the Ward crits.

`src/lib/combat/status-effects.ts` adds the minimum #7-shaped status primitives
that #8 needs to wire cleanse/castability hooks: fixed 1-turn Sleep, Silence,
and Confusion; instant Mana Burn drain; 2-3 turn Poison with 10 percentage
points of compounding degradation per uncleansed tick; status cleanse helpers;
and cast-block checks for Sleep/Silence.

## Consequences

- The UI can continue rendering the same class tree prose.
- Combat code can now ask whether a skill is unlocked/castable, how much mana
  it costs under the #5 type-chart model, and which cleanse hooks trigger.
- Full battle state, once-per-battle counters, actual HP/mana mutation, and
  party target selection remain future combat-loop responsibilities.
