import type { SpritePreset } from "./types";

/**
 * The pre-class-selection "tutorial look" presets (issue: swap in
 * `public/assets/character_creation`). These are the only 3 looks available
 * before a player locks in a class — once class-specific art exists, that
 * system supersedes this one for the rest of the game. See docs/adr/0005.
 */
export const SPRITE_PRESETS: SpritePreset[] = [
  {
    id: "wraith-01",
    label: "Verdant Wraith",
    imageSrc: "/assets/character_creation/presets/wraith-01.png",
    imageWidth: 520,
    imageHeight: 420,
  },
  {
    id: "wraith-02",
    label: "Ember Wraith",
    imageSrc: "/assets/character_creation/presets/wraith-02.png",
    imageWidth: 520,
    imageHeight: 420,
  },
  {
    id: "wraith-03",
    label: "Umbral Wraith",
    imageSrc: "/assets/character_creation/presets/wraith-03.png",
    imageWidth: 520,
    imageHeight: 420,
  },
];

/** Looks up a preset by id, throwing on an unknown id (config should always be valid). */
export function getSpritePreset(id: string): SpritePreset {
  const found = SPRITE_PRESETS.find((preset) => preset.id === id);
  if (!found) {
    throw new Error(`Unknown sprite preset id: "${id}"`);
  }
  return found;
}
