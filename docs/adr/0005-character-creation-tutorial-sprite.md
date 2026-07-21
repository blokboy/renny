# ADR 0005: Character Creation — Wraith preset sprites, single-page flow, deferred class

## Status

Accepted.

## Context

`public/assets/character_creation` was dropped into the repo: a licensed
sprite pack of 3 "Wraith" monster characters (`Wraith_01`/`02`/`03`), each
with pre-composited PNG art (`Vector Parts`: `Body`/`Head`/`Face 01-03`/arm
and hand pieces) and full animation-frame sequences (Idle, Walking,
Attacking, ...), plus an `Animations.scml` Spriter Pro project file per
Wraith. This supersedes the placeholder SVG body/head/hair shapes from
ADR 0001 for Character Creation specifically.

Two real gaps existed against "just wire in the new art":

1. **No safe way to recompose the parts.** `Vector Parts` images are
   cropped-to-content (e.g. `Body.png` 128x128, `Head.png` 260x260, `Face
   01.png` 160x128) — not pre-positioned on a shared full-size canvas.
   Correctly stacking them requires the bone/pivot offsets that live in
   `Animations.scml` (Spriter's own project format); without parsing that,
   manual compositing risks visibly misaligned art. The pack's own flattened
   `PNG Sequences/Idle/*_000.png` frames (520x420, one per Wraith) are
   already correctly composited by the artist and carry no such risk.
2. **`Face 01/02/03.png` turned out to be eye-glow crops, not headshots.**
   Visual inspection showed each "Face" variant is just a pair of glowing
   eyes (e.g. teal/green for Wraith_01), meant to be composited onto the
   head at a specific eye-socket offset — the same missing-offset problem as
   above, and not usable standalone as an icon/avatar either.

Separately, this landed alongside two product-shape changes made in the
same conversation as the asset swap, both from direct user instruction
rather than the issue's original spec:

3. Character Creation's 3-step wizard (Appearance -> Name -> Class) is
   flattened to a single page.
4. Class selection is removed from Character Creation entirely, deferred to
   immediately before the Threshold Guardian (issues #11/#12). Character
   Creation now only collects name + appearance.

## Decision

### Sprite: flat presets, not composable layers

`CharacterSpriteConfig` drops the body/head/hair/skin-tone/hair-color shape
entirely and becomes `{ presetId: string }`. `SpritePreset`
(`src/lib/assets/sprite-presets.ts`) is a flat `{ id, label, imageSrc,
imageWidth, imageHeight }` pointing at one of the 3 Wraiths' flattened Idle
frame, copied into a clean `public/assets/character_creation/presets/`
folder (the original nested `PNG/Wraith_0N/PNG Sequences/Idle/..._000.png`
paths are left in place, unreferenced by code). `<CharacterSprite>` renders
that image directly via `next/image`, matching `<SceneBackground>`'s
existing convention for real (non-placeholder) art.

The `Face` eye-glow variants are **not used** — no per-preset expression
picker exists. If per-look expressions are wanted later, the correct fix is
parsing `Animations.scml` for real offsets (or hand-tuning them visually),
not guessing.

`SwatchPicker`, `VariantPicker`, `sprite-variants.ts`, and `swatches.ts` are
deleted (they had no remaining callers once Character Creation stopped
using composable layers). `PresetPicker` replaces `VariantPicker` as the
generic "pick one of N labeled images" control.

### Flow: one page, name first

`CreationWizard` no longer steps through `sprite -> name -> class`; it
renders name entry (`NameInput`, a single click-and-type field — replacing
`NameEntryGrid`'s on-screen letter keyboard and its redundant second text
input) followed by the appearance picker, both visible at once, in that
order. There's no `Back`/`Next` — one "Enter the Convocation" action at the
bottom.

### Class: deferred, not removed

`CharacterRecord` (name, classId, sprite, stats, HP/mana, level, xp) is
split: the name+sprite portion becomes `CharacterDraft`, and
`CharacterRecord extends CharacterDraft` adding `classId`/`stats`/HP/mana/
level/xp. Confirming Character Creation now saves only a `CharacterDraft`
(`saveCharacterDraft`, a new parallel path in `src/lib/character/storage.ts`
alongside the existing `saveCharacter`/`getCharacter` for the eventual full
record) and routes straight to `/convocation` instead of
`/character/recap`.

`ClassPicker`, `STARTING_STATS`, and the rest of the class-data layer are
untouched and still exported — nothing here deletes them, since class
selection returns as its own step later. `/character/recap` and
`RecapView` are also left in place, unreachable from this flow for now;
whichever future issue reintroduces class selection before the Threshold
Guardian is expected to reuse (or directly repurpose) that recap screen for
the "you are now a &lt;class&gt;" moment, and to build the `CharacterRecord`
(including `level: 1, xp: 0`) at that point instead of here.

## Consequences

- Character Creation ships fully functional (build/lint clean, flow
  verified in-browser) without a Puzzle-Master-style dependency on
  `Animations.scml` parsing.
- Any future work that wants selectable expressions, or that wants to mix
  a Wraith's body with a different Wraith's head, needs real offset data
  first — this ADR deliberately didn't invent one.
- Code and copy that assumed Character Creation ends with a classed,
  fully-statted hero (e.g. `docs/adr/0002-character-creation.md`'s flow
  description) is now stale for the Character Creation portion specifically
  — the class-selection step it describes still happens, just later and not
  documented yet (belongs to whichever issue reintroduces it).
- `public/assets/character_creation` still contains ~43MB of unused
  `PNG Sequences`/`Vector Parts`/duplicate top-level `Wraith_0N/` folders
  plus `AI`/`EPS` design sources (now gitignored, see the `.gitignore`
  change in this same commit) — left as-is rather than deleted, since it's
  a raw asset drop the person who added it may still want for reference.

## Alternatives considered

- **Parse `Animations.scml` to composite parts + swappable expressions** —
  rejected for now: real engineering cost (bone hierarchy, pivot/angle/scale
  math) for a tutorial-phase placeholder the user explicitly called
  low-stakes ("just for the tutorial"). Revisit if expressions turn out to
  matter.
- **Keep the 3-step wizard, add class back later as a 4th step** —
  rejected per direct instruction; single page is simpler and the user
  confirmed deferring class doesn't need a placeholder step in its old slot.
