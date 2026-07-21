/**
 * Core types for Renny's shared visual asset system.
 *
 * See docs/adr/0001-shared-asset-system.md for the full contract this module
 * offers to consumers (Character Creation, the Convocation, the Town Hub).
 */

/** A single flat-shape primitive used to build a placeholder sprite layer. */
export type ShapeSpec =
  | { kind: "rect"; x: number; y: number; width: number; height: number; rx?: number }
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "polygon"; points: string };

/**
 * One selectable option for a sprite layer (e.g. one hair style, one body
 * shape). `shapes` are composed together and tinted by whichever swatch
 * applies to that layer (skin tone for body/head, hair color for hair).
 *
 * This is the extension point for real art later: a variant can grow an
 * optional `imageSrc` (mirroring `BackgroundLayer` below) without changing
 * the public `CharacterSprite` component contract.
 */
export interface SpriteVariant {
  id: string;
  label: string;
  shapes: ShapeSpec[];
}

/** The three composable layers of a Renny character sprite, bottom to top. */
export type SpriteLayerName = "body" | "head" | "hair";

/** A named, reusable color swatch (skin tone or hair color). */
export interface Swatch {
  id: string;
  label: string;
  hex: string;
}

/**
 * The full selection needed to render one composed character sprite. This is
 * the canonical serializable "how does this hero look" record — Character
 * Creation should persist this shape as-is alongside name/class.
 */
export interface CharacterSpriteConfig {
  bodyVariantId: string;
  headVariantId: string;
  hairVariantId: string;
  skinToneId: string;
  hairColorId: string;
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
