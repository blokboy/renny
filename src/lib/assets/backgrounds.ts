import type { BackgroundScene } from "./types";

/**
 * The Convocation/"tutorial zone" background — the shared background/tileset
 * convention's first real (non-placeholder) instance. Built from the
 * pre-existing layered map pack staged at
 * `public/assets/tutorial/_PNG/01/layers/{l1_sky,l2_ground,l3_decorations}.png`,
 * copied into the asset system's own convention path
 * (`public/assets/backgrounds/tutorial-zone/*`) under the canonical
 * sky/ground/decoration layer names.
 *
 * Per prompt-quest-full-spec.md: "The tutorial sequence (Convocation) reuses
 * the same background/asset conventions as the town, per the shared asset
 * map" — this scene is that shared background, and #10 (the Convocation)
 * should import `TUTORIAL_ZONE_BACKGROUND` directly rather than redefining it.
 */
export const TUTORIAL_ZONE_BACKGROUND: BackgroundScene = {
  id: "tutorial-zone",
  label: "Tutorial Zone (Convocation shrine)",
  layers: [
    { id: "sky", kind: "sky", src: "/assets/backgrounds/tutorial-zone/sky.png" },
    { id: "ground", kind: "ground", src: "/assets/backgrounds/tutorial-zone/ground.png" },
    {
      id: "decorations",
      kind: "decoration",
      src: "/assets/backgrounds/tutorial-zone/decorations.png",
    },
  ],
};

/**
 * A flat-color placeholder for the Town Hub (#13), which has no real art
 * yet. Uses the identical layer convention (sky/ground/decoration) as
 * `TUTORIAL_ZONE_BACKGROUND` so swapping in real art later is a matter of
 * adding `src` to each layer, not restructuring the scene.
 */
export const TOWN_HUB_PLACEHOLDER_BACKGROUND: BackgroundScene = {
  id: "town-hub-placeholder",
  label: "Town Hub (placeholder, no art yet)",
  layers: [
    { id: "sky", kind: "sky", color: "#8fb8d9" },
    { id: "ground", kind: "ground", color: "#7a9a5a" },
    { id: "decorations", kind: "decoration", color: "transparent" },
  ],
};

/** All named scene presets, keyed by id, for lookup/registration by consumers. */
export const BACKGROUND_SCENES: Record<string, BackgroundScene> = {
  [TUTORIAL_ZONE_BACKGROUND.id]: TUTORIAL_ZONE_BACKGROUND,
  [TOWN_HUB_PLACEHOLDER_BACKGROUND.id]: TOWN_HUB_PLACEHOLDER_BACKGROUND,
};
