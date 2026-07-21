# Context

Domain glossary for Renny (working title "Prompt Quest"). See `docs/adr/` for architectural
decisions; each glossary entry below points at the ADR that resolved it.

## Asset system (issue #2, ADR 0001)

- **Sprite composition** — originally three stacked layers (`body -> head -> hair`), each
  independently selectable and tinted by a swatch. Superseded for the tutorial phase by a
  flat preset system (`SpritePreset`, `CharacterSpriteConfig`) — see
  `docs/adr/0005-character-creation-tutorial-sprite.md`.
- **Sprite preset** — one of 3 pre-composited whole-character looks (from
  `public/assets/character_creation`) a player picks before a class is chosen. Not
  composable layers: the art pack has no per-part offset data to safely re-layer with.
- **Background scene** — an ordered `sky -> ground -> decoration` stack of layers (each a
  real image or a flat-color fallback) rendered via `SceneBackground`. The Convocation and
  the Town Hub share this one convention rather than each defining their own.
- **Tileset** — a small, fixed-size (32px) flat-color tile registry (`TileType`) for simple
  ground/collision maps, rendered via `TileGrid`.

## Character Creation (issue #3, ADR 0002)

- **Character record** — the persisted result of Character Creation: name, class, sprite
  config, starting stats, starting HP/mana. Saved via `saveCharacter`/`getCharacter`
  (`src/lib/character/storage.ts`), currently backed by `localStorage` — no database exists
  yet. See `docs/adr/0002-character-creation.md`.
- **Starting stats** — per-class Level-1 `CharacterStats` (`src/lib/character/starting-stats.ts`).
  Shipped as an issue #3 placeholder, kept as-is and finalized by issue #5. See
  `docs/adr/0003-stats-mana-economy.md`.
- **Spell cost model** — a named skill is either `free` or a multiplier on the *baseline*
  mana cost (10% of max mana, per `prompt-quest-full-spec.md` §5.1). See
  `src/lib/character/mana.ts`.
- **Ward** — each class's unique anti-injection spell (name/flavor only here; mechanics
  belong to issue #7, still open). Shown on the class picker alongside the Lv1/25/50/75/100
  spell list.

## Stats & Mana Economy (issue #5, ADR 0003)

- **Stat growth** — `getStatsAtLevel(classId, level)` (`src/lib/character/starting-stats.ts`):
  a *pure* function recomputing a character's current 5 stats from its Level-1 starting stats
  and a per-class `STAT_GROWTH_PER_LEVEL` table, rather than an incremental mutator. Issue #9's
  leveling engine calls this and re-saves the result on every level change.
- **Cast mana cost** — `getCastManaCost` (`src/lib/character/mana.ts`): the baseline cost (10%
  of max mana × the spell's surcharge/discount multiplier) run through the type-chart's cost
  divisor (`getEffectiveCost`, issue #6) for the puzzle's family tag. Distinct from
  `resolveSpellCost`, the creation-screen display path with no puzzle/divisor in play yet.
- **Crit (LCK)** — `rollCrit(score, lck)` (`src/lib/combat/resolve.ts`): only a near-perfect
  judge score (≥0.9) is crit-eligible at all; LCK sets the chance within that. Distinct from
  `typeChart.ts`'s `getCritChance`, which is Monk's own puzzle-family crit table (issue #6) —
  a different, unrelated mechanic that happens to share the word "crit."
- **Turn order (SPD)** — `getTurnOrder` (`src/lib/combat/turnOrder.ts`): a stable sort by SPD,
  descending. No multi-actor battle loop exists yet to consume it.

## XP & Leveling (issue #9, ADR 0004)

- **XP curve** — `XP_to_next(level) = round(50 × level^1.5)` (`src/lib/xp/curve.ts`). Not a
  placeholder; the base constant is the spec's own number.
- **Economy/Elegance bonus** — two continuous, additively-stacking XP multipliers (each
  capped at +50%): Economy rewards staying under a puzzle's expected token budget, Elegance
  scales off the Judge's continuous 0-1 elegance score. See `src/lib/xp/bonuses.ts` and
  `docs/adr/0004-xp-leveling.md`.
- **Elegance score** — the Judge's continuous 0-1 read on how minimal/precise the *player's
  prompt* was (superseding the earlier `elegant` boolean). `JudgeResult.elegance`.
- **Stat growth on level-up** — `applyXpGain` (`src/lib/xp/leveling.ts`) recomputes stats via
  issue #5's `getStatsAtLevel(classId, finalLevel)` after crossing thresholds, rather than
  accumulating per-level — matching that function's own pure-per-level contract.
- **Calibration check** — a simulated (not live-played) onboarding funnel proving the curve +
  bonuses land a character at Level 10 by the time the onboarding funnel would end. See
  `src/lib/xp/calibration.ts` and `/debug/xp`.

## Status Effects & Wards (issue #7, ADR 0006)

- **Status effect** — `StatusEffectInstance` (`src/lib/combat/types.ts`): Sleep/Silence/
  Confusion/Poison, each a fixed, flat-duration turn count (never scaled by tier/boss level).
  Mana Burn is deliberately *not* one of these — it's an instant, one-time mana drain, not a
  duration effect at all (`applyManaBurn`, `src/lib/combat/statusEffects.ts`).
- **Poison severity** — the one status effect that doesn't stay flat: compounds ×1.1 per turn
  it isn't cleansed (`tickStatusEffects`), resetting entirely on cleanse. See
  `docs/adr/0006-status-effects-wards.md` for the exact formula and how it optionally degrades
  text (`degradeTextWithPoison`).
- **Cleanse primitive** — `cleanseStatusEffect(effects, type)`
  (`src/lib/combat/statusEffects.ts`): removes every instance of one effect type. Issue #8's
  skill-tree cleanse triggers (§5.2's Cleric/Poison, Bard/Confusion, Wizard/Silence,
  Rogue/Mana Burn, Hunter/Sleep table) are expected to call this directly once that issue
  wires them up — not built here.
- **Ward** — each class's anti-injection spell *mechanic* (`src/lib/combat/wards.ts`),
  distinct from `classes.ts`'s `ward` field (name/description only, issue #3). All 7 build on
  one shared, explicitly-provisional injection-detection heuristic
  (`detectSuspiciousSegments`) but differ in behavior — e.g. Knight's Shield Wall is
  persistent stance state rather than a one-shot cast, Monk's Empty Mind takes no detector
  pass at all and discards everything but the literal puzzle statement.
- **Monk crit-cleanse hook** — "Monk crit while casting Empty Mind removes a random status
  effect from the whole party" (§5.2) is a standing Ward-triggered hook, *not* a skill-tree
  node — `cleansePartyRandomStatusEffect` (`src/lib/combat/wards.ts`) implements the effect;
  detecting the trigger itself belongs to a future combat loop.

## Threshold Guardian (issue #11, ADR 0008)

- **Guardian encounter** — the first generated battle, represented by a `GuardianEncounter`
  definition plus pure `GuardianBattleState` transitions in `src/lib/guardian`.
- **Dependency Lock** — a shield-phase convergence puzzle where an NPC's generated output is
  embedded into the player's later shard; issue #11 rolls evenly across Multi-hop, Ambiguity,
  and Reverse-prompt. Interrogation remains owned by issue #12.
- **Guardian completion** — a browser-persisted victory marker written by
  `markGuardianComplete`, intended to gate the Town Hub in issue #13.
