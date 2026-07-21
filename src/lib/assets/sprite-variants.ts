import type { SpriteVariant } from "./types";

/**
 * Crude placeholder geometry for each sprite layer, drawn on a 64x64 viewBox.
 * These are intentionally simple shapes (per the issue's scope: "colored
 * rectangles/simple shapes are fine") — the layering/swatch mechanism is the
 * real deliverable, not the art. Swap `shapes` for real sprite art later
 * without touching `CharacterSprite` or any consumer.
 */

export const BODY_VARIANTS: SpriteVariant[] = [
  {
    id: "tunic",
    label: "Tunic",
    shapes: [{ kind: "rect", x: 20, y: 32, width: 24, height: 28, rx: 3 }],
  },
  {
    id: "robe",
    label: "Robe",
    shapes: [{ kind: "polygon", points: "18,34 46,34 52,60 12,60" }],
  },
  {
    id: "armor",
    label: "Armor",
    shapes: [
      { kind: "rect", x: 18, y: 30, width: 28, height: 30, rx: 2 },
      { kind: "rect", x: 12, y: 30, width: 8, height: 10, rx: 2 },
      { kind: "rect", x: 44, y: 30, width: 8, height: 10, rx: 2 },
    ],
  },
];

export const HEAD_VARIANTS: SpriteVariant[] = [
  {
    id: "round",
    label: "Round",
    shapes: [{ kind: "circle", cx: 32, cy: 20, r: 14 }],
  },
  {
    id: "oval",
    label: "Oval",
    shapes: [{ kind: "ellipse", cx: 32, cy: 20, rx: 13, ry: 16 }],
  },
  {
    id: "square",
    label: "Square",
    shapes: [{ kind: "rect", x: 18, y: 6, width: 28, height: 28, rx: 4 }],
  },
];

export const HAIR_VARIANTS: SpriteVariant[] = [
  {
    id: "bald",
    label: "Bald",
    shapes: [],
  },
  {
    id: "short",
    label: "Short",
    shapes: [{ kind: "ellipse", cx: 32, cy: 11, rx: 15, ry: 8 }],
  },
  {
    id: "long",
    label: "Long",
    shapes: [
      { kind: "ellipse", cx: 32, cy: 10, rx: 15, ry: 8 },
      { kind: "rect", x: 15, y: 8, width: 7, height: 26, rx: 3 },
      { kind: "rect", x: 42, y: 8, width: 7, height: 26, rx: 3 },
    ],
  },
  {
    id: "mohawk",
    label: "Mohawk",
    shapes: [{ kind: "rect", x: 28, y: 1, width: 8, height: 17, rx: 2 }],
  },
];
