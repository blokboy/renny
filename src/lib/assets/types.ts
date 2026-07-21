/**
 * Core types for Renny's shared visual asset system.
 *
 * See docs/adr/0001-shared-asset-system.md for the full contract this module
 * offers to consumers (Character Creation, the Convocation, the Town Hub).
 */

/**
 * One selectable whole-character look, pre-composited by an artist (not a
 * composable body/head/hair layer stack — see docs/adr/0005 for why: this
 * pack has no per-part offset data to safely re-layer with, so a preset is
 * one flat image).
 */
export interface SpritePreset {
  id: string;
  label: string;
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
}

/**
 * The full selection needed to render one composed character sprite. This is
 * the canonical serializable "how does this hero look" record — Character
 * Creation should persist this shape as-is alongside name/class.
 */
export interface CharacterSpriteConfig {
  presetId: string;
}

/**
 * One playable enemy's sprite: a static idle look plus ordered walking,
 * hurt, and dying frame-cycles. Distinct from `SpritePreset` (a single flat
 * image) because enemies need to animate a walk-in entrance the way the
 * player's Wraith already does on the loading screen, and (issue: combat
 * resolution) a hit/hurt/death reaction — `idleImageSrc` covers the
 * flat-image case, the frame-cycle arrays cover the animated ones.
 */
export interface EnemySpritePreset {
  id: string;
  label: string;
  idleImageSrc: string;
  walkingFrameSrcs: string[];
  hurtFrameSrcs: string[];
  dyingFrameSrcs: string[];
  imageWidth: number;
  imageHeight: number;
}

/** The three layer kinds in the shared background/scene convention. */
export type BackgroundLayerKind = "sky" | "ground" | "decoration";

/**
 * One layer of a scene background, rendered back-to-front in the order
 * `sky` -> `ground` -> `decoration`. A layer supplies either a real image
 * (`src`, a path under `/public`) or a flat `color` fallback — consumers can
 * start with `color` and swap in `src` later without changing how the scene
 * is composed.
 */
export interface BackgroundLayer {
  id: string;
  kind: BackgroundLayerKind;
  src?: string;
  color?: string;
}

/** A named, reusable scene background built from the layer convention above. */
export interface BackgroundScene {
  id: string;
  label: string;
  layers: BackgroundLayer[];
}

/** A single tile type in the shared flat-color tileset convention. */
export interface TileType {
  id: string;
  label: string;
  color: string;
}
