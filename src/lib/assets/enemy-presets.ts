import type { EnemySpritePreset } from "./types";

const WALKING_FRAME_COUNT = 24;
const IMAGE_SIZE = 900;

/**
 * Builds the ordered walking-frame paths for one Minotaur variant, straight
 * from its raw craftpix pack (`public/assets/enemies/Minotaur_<n>/PNG/PNG
 * Sequences/Walking/...`) — the same "reference the raw PNG Sequences frames
 * directly, don't stage a copy" convention the Wraith's own walking animation
 * uses on the loading screen (`LoadingTransition`'s `walkingFrame`).
 */
function minotaurWalkingFrames(variant: number): string[] {
  return Array.from({ length: WALKING_FRAME_COUNT }, (_, frame) => {
    const frameNumber = String(frame).padStart(3, "0");
    return `/assets/enemies/Minotaur_${variant}/PNG/PNG Sequences/Walking/0_Minotaur_Walking_${frameNumber}.png`;
  });
}

function minotaurIdleImage(variant: number): string {
  return `/assets/enemies/Minotaur_${variant}/PNG/PNG Sequences/Idle/0_Minotaur_Idle_000.png`;
}

/**
 * The Convocation's three Minotaur enemy presets (issue #10's trial
 * staging). All three variants share the same rig/frame counts, just
 * different art, so the id/label are the only per-variant fields beyond the
 * generated paths.
 */
export const MINOTAUR_PRESETS: EnemySpritePreset[] = [1, 2, 3].map((variant) => ({
  id: `minotaur-${variant}`,
  label: `Minotaur ${variant}`,
  idleImageSrc: minotaurIdleImage(variant),
  walkingFrameSrcs: minotaurWalkingFrames(variant),
  imageWidth: IMAGE_SIZE,
  imageHeight: IMAGE_SIZE,
}));

/** Looks up an enemy preset by id, throwing on an unknown id (config should always be valid). */
export function getEnemyPreset(id: string): EnemySpritePreset {
  const found = MINOTAUR_PRESETS.find((preset) => preset.id === id);
  if (!found) {
    throw new Error(`Unknown enemy preset id: "${id}"`);
  }
  return found;
}
