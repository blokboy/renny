# ADR 0001: Shared visual asset system (sprite composition + background/tileset convention)

## Status

Accepted.

## Context

Issue #2 ("Asset Mapping") blocks #3 (Character Creation), #10 (the Convocation), and #13
(the Town Hub) — all three need a way to render a player's character sprite and a way to
render a scene's background, without each reinventing the mechanism.

`prompt-quest-full-spec.md` §3.2 already pins down the shape of the character sprite:

> **Sprite:** procedurally composed pixel character (head/hair/body layers), customizable
> skin tone and hair color via swatch palettes.

and notes the background convention is meant to be shared, not per-feature:

> The tutorial sequence (Convocation) reuses the same background/asset conventions as the
> town, per the shared asset map — a continuity note for art, not a mechanical one.

This ADR is the "shared asset map" referenced above.

Per the issue's scope, actual art is out of scope — "actual art assets can be crude
placeholders (colored rectangles/simple shapes are fine) as long as the layering/swatch/
tileset mechanism is real and demonstrable." Real character art does not exist yet. Real
*background* art for the tutorial zone does, however: a layered map pack was already staged
(untracked) at `public/assets/tutorial/_PNG/01/layers/{l1_sky,l2_ground,l3_decorations}.png`.
That pack's own layer names (sky / ground / decorations) directly match the layering
convention this ADR needed anyway, so it was adopted as the Convocation's real background
rather than invented from scratch.

## Decision

### 1. Sprite composition

A character sprite is three independently-selectable layers, composed back-to-front:

```
body -> head -> hair
```

Each layer's *shape* comes from a small registry of `SpriteVariant`s (id + label + an array
of flat SVG shape primitives — rects/circles/ellipses/polygons on a 64x64 grid). Color comes
from two swatch registries, applied per layer:

- **skin tone** tints `body` and `head`
- **hair color** tints `hair`

The full selection is one plain object:

```ts
interface CharacterSpriteConfig {
  bodyVariantId: string;
  headVariantId: string;
  hairVariantId: string;
  skinToneId: string;
  hairColorId: string;
}
```

This is the canonical, serializable "how does this hero look" record. Character Creation
should persist it as-is, alongside name/class — there is no separate "rendered sprite" asset
to manage.

Rendering happens through one component, `<CharacterSprite config={...} size?  className? />`
(`src/components/assets/CharacterSprite.tsx`). It is the only place that knows how to turn a
config into pixels; consumers never compose layers themselves.

**Extension point:** a `SpriteVariant`'s `shapes` array is a placeholder. Real sprite art
later would add an optional `imageSrc` to `SpriteVariant` (mirroring how `BackgroundLayer`
already supports `src` vs. `color`, below) and have `CharacterSprite` prefer it over
`shapes` when present — a change contained entirely inside `CharacterSprite` and the
variant registries, with zero changes required in Character Creation/Convocation/Town Hub
call sites.

Equipment/gear coloring (class-specific, per `prompt-quest-design-doc.md` §2) is explicitly
**not** part of this config — it is a separate visual concern Character Creation can layer
on top of the base sprite later.

### 2. Background/tileset convention

A scene background is an ordered list of layers, always in this order:

```
sky -> ground -> decoration
```

Each layer supplies either a real image (`src`, a path under `/public`) or a flat `color`
fallback:

```ts
type BackgroundLayerKind = "sky" | "ground" | "decoration";

interface BackgroundLayer {
  id: string;
  kind: BackgroundLayerKind;
  src?: string;
  color?: string;
}

interface BackgroundScene {
  id: string;
  label: string;
  layers: BackgroundLayer[];
}
```

Rendering happens through `<SceneBackground scene={...} className? children? />`
(`src/components/assets/SceneBackground.tsx`), which stacks each layer full-bleed inside the
container (`className` must give the container a real size, e.g. an `aspect-*` + `w-*`
utility, since layers render with `next/image`'s `fill`).

Two presets exist today (`src/lib/assets/backgrounds.ts`):

- **`TUTORIAL_ZONE_BACKGROUND`** — the Convocation's shrine backdrop, using real art copied
  from the pre-existing tutorial map pack into
  `public/assets/backgrounds/tutorial-zone/{sky,ground,decorations}.png`.
- **`TOWN_HUB_PLACEHOLDER_BACKGROUND`** — flat-color placeholder for the Town Hub, using the
  identical layer shape. Swapping in real Town art later is adding `src` to each layer, not
  restructuring the scene.

Both are registered in `BACKGROUND_SCENES` by id.

A complementary, much simpler **tileset** convention exists for flat-color tile maps
(`src/lib/assets/tiles.ts`): a fixed `TILE_SIZE` (32px), a small `TileType` registry
(id/label/color), and a `<TileGrid tileMap className? />` component that renders a
`string[][]` of tile ids as colored cells. This is intentionally minimal — it exists so a
consumer needing a simple ground/collision grid (rather than a full parallax scene) has one
obvious place to add tile types, instead of inventing its own.

### 3. Where things live

- Registries and types: `src/lib/assets/*.ts`, re-exported from `src/lib/assets/index.ts`
  (import everything from `@/lib/assets`, not individual files).
- Rendering components: `src/components/assets/*.tsx`, re-exported from
  `src/components/assets/index.ts`.
- Real image files: `public/assets/<category>/<scene-or-variant>/...` — e.g.
  `public/assets/backgrounds/tutorial-zone/`.
- Debug/demo page: `/dev/assets` (`src/app/dev/assets/page.tsx` + the interactive
  `AssetDemo` client component), exercising every piece of the above — the character
  composer, both background presets, and the tile grid.

## Consumer guidance

- **Character Creation (#3):** import `CharacterSpriteConfig`, `CharacterSprite`, the
  `BODY_VARIANTS`/`HEAD_VARIANTS`/`HAIR_VARIANTS` registries, `SKIN_TONES`/`HAIR_COLORS`, and
  the `SwatchPicker`/`VariantPicker` components directly from `@/lib/assets` and
  `@/components/assets`. Persist the resulting `CharacterSpriteConfig` object.
- **The Convocation (#10):** render its shrine backdrop with
  `<SceneBackground scene={TUTORIAL_ZONE_BACKGROUND}>`. Do not redefine the shrine's layers —
  import the preset.
- **The Town Hub (#13):** define its own `BackgroundScene` (its own sky/ground/decoration
  layers, real art once available) using the exact same `BackgroundLayer` shape, and register
  it in `BACKGROUND_SCENES` alongside the existing presets rather than inventing a parallel
  layering scheme. If the hub needs a walkable tile grid, reuse `TILE_TYPES`/`TileGrid` and
  extend `TILE_TYPES` with any new tiles it needs.

## Consequences

- Adding a new body/head/hair look = one new registry entry. No component changes.
- Adding a new skin tone/hair color = one new `Swatch` entry.
- Adding a new scene = one new `BackgroundScene` entry, registered in `BACKGROUND_SCENES`.
- The placeholder-shape and flat-color mechanisms are real and swappable for actual art
  later (via `imageSrc`/`src`) without breaking the public contract (`CharacterSpriteConfig`,
  `CharacterSprite`, `BackgroundScene`, `SceneBackground`).

## Alternatives considered

- **Sprite-sheet/PNG-frame composition** for characters — rejected for this issue: no real
  character art exists yet, and building an asset pipeline before there is content to drive
  it would be speculative for what this issue needs to prove out (the layering/swatch
  mechanism).
- **One flat avatar image per class** instead of layered swatches — rejected: contradicts
  the spec's explicit head/hair/body + skin-tone/hair-color requirement (§3.2).
