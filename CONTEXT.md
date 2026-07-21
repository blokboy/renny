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
