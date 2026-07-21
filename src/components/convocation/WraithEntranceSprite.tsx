"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getSpritePreset } from "@/lib/assets";

export interface WraithEntranceSpriteProps {
  presetId: string;
  /**
   * "idle" shows the player's flat chosen-look image; "walking" loops the
   * walking frame sequence; "hurt"/"dying" play their own frame sequence
   * once and hold on the last frame (combat resolution — see
   * `ConvocationBattleStage`).
   */
  pose: "idle" | "walking" | "hurt" | "dying";
  /** Rendered width in pixels; height follows the preset's own aspect ratio. Defaults to 128. */
  size?: number;
  className?: string;
}

const FRAME_DURATION_MS = 90;
/** Poses that loop indefinitely rather than playing once and holding the last frame. */
const LOOPING_POSES = new Set(["walking"]);

/**
 * Per-pose frame-sequence config: the `PNG Sequences` subfolder, the frame
 * filename's own label (not always the same as the folder — "Walking"'s raw
 * frames are labelled "Moving Forward"), and the pack's fixed frame count.
 */
const POSE_SEQUENCE: Record<"walking" | "hurt" | "dying", { folder: string; label: string; frameCount: number }> = {
  walking: { folder: "Walking", label: "Moving Forward", frameCount: 12 },
  hurt: { folder: "Hurt", label: "Hurt", frameCount: 12 },
  dying: { folder: "Dying", label: "Dying", frameCount: 15 },
};

/**
 * Derives the zero-padded Wraith number (e.g. "01") a preset id like
 * "wraith-01" maps to, for building raw `PNG Sequences` frame paths.
 */
function wraithNumber(presetId: string): string {
  const match = presetId.match(/(\d+)$/);
  if (!match) {
    throw new Error(`Cannot derive a Wraith number from preset id "${presetId}"`);
  }
  return match[1].padStart(2, "0");
}

function frameSrc(presetId: string, pose: "walking" | "hurt" | "dying", frame: number): string {
  const n = wraithNumber(presetId);
  const { folder, label } = POSE_SEQUENCE[pose];
  const frameNumber = String(frame).padStart(3, "0");
  return `/assets/character_creation/PNG/Wraith_${n}/PNG Sequences/${folder}/Wraith_${n}_${label}_${frameNumber}.png`;
}

/** A non-looping pose (hurt/dying) starts on its last frame under reduced motion — the defeated end state, not a mid-flinch frame. */
function initialFrame(pose: WraithEntranceSpriteProps["pose"]): number {
  if (pose === "idle") return 0;
  const { frameCount } = POSE_SEQUENCE[pose];
  if (LOOPING_POSES.has(pose)) return 0;
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reduceMotion ? frameCount - 1 : 0;
}

/**
 * Renders the player's chosen Wraith preset for the Convocation battle
 * stage: `pose="idle"` shows the same flat preset image `CharacterSprite`
 * renders elsewhere; the other poses cycle their own raw frame sequence,
 * mirroring `LoadingTransition`'s own walk-in animation (same pack, same
 * padded-number naming) rather than inventing a new one.
 *
 * Loops "walking"; "hurt"/"dying" play once and hold their last frame.
 * Under `prefers-reduced-motion`, "walking" holds its first frame and
 * "hurt"/"dying" jump straight to their last (the meaningful end state — a
 * defeated pose — rather than freezing mid-flinch).
 */
export function WraithEntranceSprite({ presetId, pose, size = 128, className }: WraithEntranceSpriteProps) {
  const preset = getSpritePreset(presetId);
  const [frame, setFrame] = useState(() => initialFrame(pose));
  // Reset the frame whenever `pose` changes, without a dedicated effect —
  // React's documented pattern for adjusting state during render rather than
  // via a setState-in-effect (see react-hooks/set-state-in-effect).
  const [posedFor, setPosedFor] = useState(pose);
  if (pose !== posedFor) {
    setPosedFor(pose);
    setFrame(initialFrame(pose));
  }

  const height = Math.round((size * preset.imageHeight) / preset.imageWidth);

  useEffect(() => {
    if (pose === "idle") return;
    const { frameCount } = POSE_SEQUENCE[pose];
    const loop = LOOPING_POSES.has(pose);

    for (let i = 0; i < frameCount; i++) {
      const image = new window.Image();
      image.src = frameSrc(presetId, pose, i);
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const timer = window.setInterval(() => {
      setFrame((current) => {
        if (!loop && current >= frameCount - 1) return current;
        return (current + 1) % frameCount;
      });
    }, FRAME_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [pose, presetId]);

  const src = pose === "idle" ? preset.imageSrc : frameSrc(presetId, pose, frame);

  return (
    <Image
      src={src}
      alt={preset.label}
      width={size}
      height={height}
      unoptimized={pose !== "idle"}
      className={className}
    />
  );
}
