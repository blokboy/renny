import type { Swatch } from "./types";

/**
 * Skin tone swatches. Applied to both the `body` and `head` sprite layers,
 * since this issue's scope covers skin/hair only — clothing/equipment
 * coloring (class gear) is a separate, later concern for Character Creation
 * to layer on top of this base sprite.
 */
export const SKIN_TONES: Swatch[] = [
  { id: "porcelain", label: "Porcelain", hex: "#f2d3b3" },
  { id: "fair", label: "Fair", hex: "#e8b98d" },
  { id: "tan", label: "Tan", hex: "#c98d5f" },
  { id: "deep", label: "Deep", hex: "#8b5a34" },
  { id: "ebony", label: "Ebony", hex: "#5a3620" },
];

/** Hair color swatches. Applied to the `hair` sprite layer only. */
export const HAIR_COLORS: Swatch[] = [
  { id: "black", label: "Black", hex: "#1c1712" },
  { id: "brown", label: "Brown", hex: "#5b3a29" },
  { id: "blonde", label: "Blonde", hex: "#e8c873" },
  { id: "auburn", label: "Auburn", hex: "#9a4b2f" },
  { id: "silver", label: "Silver", hex: "#c9c9c9" },
  { id: "azure", label: "Azure", hex: "#4a7fd6" },
];

/** Looks up a swatch by id, throwing on an unknown id (config should always be valid). */
export function getSwatch(swatches: Swatch[], id: string): Swatch {
  const found = swatches.find((swatch) => swatch.id === id);
  if (!found) {
    throw new Error(`Unknown swatch id: "${id}"`);
  }
  return found;
}
