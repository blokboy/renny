# Context

Domain glossary for Renny (working title "Prompt Quest"). See `docs/adr/` for architectural
decisions; each glossary entry below points at the ADR that resolved it.

## Asset system (issue #2, ADR 0001)

- **Sprite composition** — a character sprite is three stacked layers, `body -> head ->
  hair`, each independently selectable and tinted by a swatch. Persisted as a
  `CharacterSpriteConfig`. See `docs/adr/0001-shared-asset-system.md`.
- **Swatch** — a named, reusable color (a skin tone or a hair color) applied to a sprite
  layer. Not to be confused with class/equipment coloring, which is a separate, later
  concern.
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
- **Starting stats/mana** — provisional placeholders (`src/lib/character/starting-stats.ts`),
  pending issue #5 (Stats & Mana Economy). Not final numbers; isolated in one file so #5 can
  replace them wholesale.
- **Spell cost model** — a named skill is either `free` or a multiplier on the *baseline*
  mana cost (10% of max mana, per `prompt-quest-full-spec.md` §5.1). See
  `src/lib/character/mana.ts`.
- **Ward** — each class's unique anti-injection spell (name/flavor only here; mechanics
  belong to issue #7, still open). Shown on the class picker alongside the Lv1/25/50/75/100
  spell list.
