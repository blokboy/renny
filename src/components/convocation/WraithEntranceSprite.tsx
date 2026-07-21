"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getSpritePreset } from "@/lib/assets";

export interface WraithEntranceSpriteProps {
  presetId: string;
  /** "idle" shows the player's flat chosen-look image; "walking" cycles the walking frame sequence. */
  pose: "idle" | "walking";
  /** Rendered width in pixels; height follows the preset's own aspect ratio. Defaults to 128. */
  size?: number;
  className?: string;
}

const WALKING_FRAME_COUNT = 12;
const FRAME_DURATION_MS = 90;

/**
 * Derives the zero-padded Wraith number (e.g. "01") a preset id like
 * "wraith-01" maps to, for building raw `PNG Sequences/Walking` frame paths.
 */
function wraithNumber(presetId: string): string {
  const match = presetId.match(/(\d+)$/);
  if (!match) {
    throw new Error(`Cannot derive a Wraith number from preset id "${presetId}"`);
  }
  return match[1].padStart(2, "0");
}

function walkingFrameSrc(presetId: string, frame: number): string {
  const n = wraithNumber(presetId);
  const frameNumber = String(frame).padStart(3, "0");
  return `/assets/character_creation/PNG/Wraith_${n}/PNG Sequences/Walking/Wraith_${n}_Moving Forward_${frameNumber}.png`;
}

/**
 * Renders the player's chosen Wraith preset for the Convocation battle
 * stage's entrance: `pose="idle"` shows the same flat preset image
 * `CharacterSprite` renders elsewhere; `pose="walking"` cycles the raw
 * walking frame sequence, mirroring `LoadingTransition`'s own walk-in
 * animation (same pack, same 12-frame convention, same padded-number
 * naming) rather than inventing a new one.
 *
 * Unlike `EnemySprite`, this component has no internal
 * `prefers-reduced-motion` guard — the Convocation battle stage that calls
 * it already decides never to pass `pose="walking"` under reduced motion,
 * so there's a single source of truth for that decision.
 */
export function WraithEntranceSprite({ presetId, pose, size = 128, className }: WraithEntranceSpriteProps) {
  const preset = getSpritePreset(presetId);
  const [frame, setFrame] = useState(0);
  const height = Math.round((size * preset.imageHeight) / preset.imageWidth);

  useEffect(() => {
    if (pose !== "walking") return;

    for (let i = 0; i < WALKING_FRAME_COUNT; i++) {
      const image = new window.Image();
      image.src = walkingFrameSrc(presetId, i);
    }

    const timer = window.setInterval(
      () => setFrame((current) => (current + 1) % WALKING_FRAME_COUNT),
      FRAME_DURATION_MS,
    );
    return () => window.clearInterval(timer);
  }, [pose, presetId]);

  const src = pose === "walking" ? walkingFrameSrc(presetId, frame) : preset.imageSrc;

  return (
    <Image
      src={src}
      alt={preset.label}
      width={size}
      height={height}
      unoptimized={pose === "walking"}
      className={className}
    />
  );
}
