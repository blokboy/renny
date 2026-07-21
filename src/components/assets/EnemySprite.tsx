"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getEnemyPreset } from "@/lib/assets";

export interface EnemySpriteProps {
  presetId: string;
  /** "idle" shows the flat idle image; "walking" cycles the walking frame sequence. Defaults to "idle". */
  pose?: "idle" | "walking";
  /** Rendered width in pixels; height follows the preset's own aspect ratio. Defaults to 128. */
  size?: number;
  /** Milliseconds between walking frames. Defaults to 90, matching the Wraith's loading-screen walk cycle. */
  frameDurationMs?: number;
  className?: string;
}

const DEFAULT_FRAME_DURATION_MS = 90;

/**
 * Renders an enemy's chosen preset — a flat idle image, or (pose="walking")
 * a looping frame-cycle animation. This is the enemy-side counterpart to
 * `CharacterSprite`: takes a preset id and resolves it internally via
 * `getEnemyPreset`, the same "caller never holds a resolved preset" contract
 * `CharacterSprite` uses for `SpritePreset`. See `EnemySpritePreset` for why
 * enemies get a separate idle/walking shape instead of one flat image.
 *
 * Respects `prefers-reduced-motion` by holding on the first walking frame
 * instead of cycling, same as the Wraith's own walk-in animation.
 */
export function EnemySprite({
  presetId,
  pose = "idle",
  size = 128,
  frameDurationMs = DEFAULT_FRAME_DURATION_MS,
  className,
}: EnemySpriteProps) {
  const preset = getEnemyPreset(presetId);
  const [frame, setFrame] = useState(0);
  // Reset the frame whenever `pose` changes, without a dedicated effect —
  // React's documented pattern for adjusting state during render rather than
  // via a setState-in-effect (see react-hooks/set-state-in-effect).
  const [posedFor, setPosedFor] = useState(pose);
  if (pose !== posedFor) {
    setPosedFor(pose);
    setFrame(0);
  }

  const height = Math.round((size * preset.imageHeight) / preset.imageWidth);

  useEffect(() => {
    if (pose !== "walking") return;

    preset.walkingFrameSrcs.forEach((src) => {
      const image = new window.Image();
      image.src = src;
    });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const timer = window.setInterval(
      () => setFrame((current) => (current + 1) % preset.walkingFrameSrcs.length),
      frameDurationMs,
    );
    return () => window.clearInterval(timer);
  }, [pose, preset.walkingFrameSrcs, frameDurationMs]);

  const src = pose === "walking" ? preset.walkingFrameSrcs[frame] : preset.idleImageSrc;

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
