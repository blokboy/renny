import type { SpritePreset } from "./types";

/**
 * Every selectable whole-character look in the game, keyed by `id`:
 *
 * - The 3 `wraith-0N` tutorial-phase looks (see docs/adr/0005) are the only
 *   ones available before a class is chosen — the Convocation trials render
 *   the player as one of these, picked automatically (no player choice; see
 *   `CreationWizard`).
 * - The 7 class looks, one flattened Idle-pose portrait per class from the
 *   first preset directory under its folder in
 *   `public/assets/character_creation` (e.g. Bard -> `Bloody_Alchemist_1`,
 *   Cleric -> `Fallen_Angels_1`). Their `id`s are the matching `ClassId`
 *   string (`@/lib/character`'s `CLASSES`) — kept as plain strings here
 *   rather than importing `ClassId` to avoid a `lib/assets` <->
 *   `lib/character` cycle, since `CharacterSpriteConfig` already flows the
 *   other way. Once a class is chosen, this preset becomes the hero's
 *   permanent look, carried through to the Threshold Guardian.
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
  {
    id: "rogue",
    label: "Rogue — Dark Oracle",
    imageSrc:
      "/assets/character_creation/Rogue/Dark_Oracle_1/PNG/PNG Sequences/Idle/0_Dark_Oracle_Idle_000.png",
    imageWidth: 900,
    imageHeight: 900,
  },
  {
    id: "knight",
    label: "Knight — Skeleton Crusader",
    imageSrc:
      "/assets/character_creation/Knight/Skeleton_Crusader_1/PNG/PNG Sequences/Idle/0_Skeleton_Crusader_Idle_000.png",
    imageWidth: 900,
    imageHeight: 900,
  },
  {
    id: "wizard",
    label: "Wizard — Seer",
    imageSrc: "/assets/character_creation/Wizard/Seer_1/PNG/PNG Sequences/Idle/0_Seer_Idle_000.png",
    imageWidth: 900,
    imageHeight: 900,
  },
  {
    id: "bard",
    label: "Bard — Bloody Alchemist",
    imageSrc:
      "/assets/character_creation/Bard/Bloody_Alchemist_1/PNG/PNG Sequences/Idle/0_Bloody_Alchemist_Idle_000.png",
    imageWidth: 900,
    imageHeight: 900,
  },
  {
    id: "cleric",
    label: "Cleric — Fallen Angels",
    imageSrc:
      "/assets/character_creation/Cleric/Fallen_Angels_1/PNG/PNG Sequences/Idle/0_Fallen_Angels_Idle_000.png",
    imageWidth: 900,
    imageHeight: 900,
  },
  {
    id: "hunter",
    label: "Hunter — Forest Ranger",
    imageSrc:
      "/assets/character_creation/Ranger/Forest_Ranger_1/PNG/PNG Sequences/Idle/0_Forest_Ranger_Idle_000.png",
    imageWidth: 900,
    imageHeight: 900,
  },
  {
    id: "monk",
    label: "Monk — Reaper Man",
    imageSrc: "/assets/character_creation/Monk/Reaper_Man_1/PNG/PNG Sequences/Idle/0_Reaper_Man_Idle_000.png",
    imageWidth: 900,
    imageHeight: 900,
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
