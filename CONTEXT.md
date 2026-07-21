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
