"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getEnemyPreset } from "@/lib/assets";

export interface EnemySpriteProps {
  presetId: string;
  /**
   * "idle" shows the flat idle image; "walking" loops the walking frame
   * sequence; "hurt"/"dying" play their own frame sequence once and hold on
   * the last frame (combat resolution — see `ConvocationBattleStage`).
   * Defaults to "idle".
   */
  pose?: "idle" | "walking" | "hurt" | "dying";
  /** Rendered width in pixels; height follows the preset's own aspect ratio. Defaults to 128. */
  size?: number;
  /** Milliseconds between frames. Defaults to 90, matching the Wraith's loading-screen walk cycle. */
  frameDurationMs?: number;
  className?: string;
}

const DEFAULT_FRAME_DURATION_MS = 90;
/** Poses that loop indefinitely rather than playing once and holding the last frame. */
const LOOPING_POSES = new Set(["walking"]);

function poseFrames(preset: ReturnType<typeof getEnemyPreset>, pose: NonNullable<EnemySpriteProps["pose"]>): string[] {
  switch (pose) {
    case "walking":
      return preset.walkingFrameSrcs;
    case "hurt":
      return preset.hurtFrameSrcs;
    case "dying":
      return preset.dyingFrameSrcs;
    case "idle":
      return [preset.idleImageSrc];
  }
}

/** A non-looping pose (hurt/dying) starts on its last frame under reduced motion — the defeated end state, not a mid-flinch frame. */
function initialFrame(loop: boolean, frameCount: number): number {
  if (loop) return 0;
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reduceMotion ? frameCount - 1 : 0;
}

/**
 * Renders an enemy's chosen preset — a flat idle image, or a multi-frame
 * animation for the other poses. This is the enemy-side counterpart to
 * `CharacterSprite`: takes a preset id and resolves it internally via
 * `getEnemyPreset`, the same "caller never holds a resolved preset" contract
 * `CharacterSprite` uses for `SpritePreset`. See `EnemySpritePreset` for why
 * enemies get a separate idle/walking/hurt/dying shape instead of one flat
 * image.
 *
 * Respects `prefers-reduced-motion`: "walking" holds on its first frame;
 * "hurt"/"dying" jump straight to their last frame (the meaningful end
 * state — a defeated pose — rather than freezing mid-flinch).
 */
export function EnemySprite({
  presetId,
  pose = "idle",
  size = 128,
  frameDurationMs = DEFAULT_FRAME_DURATION_MS,
  className,
}: EnemySpriteProps) {
  const preset = getEnemyPreset(presetId);
  const frames = poseFrames(preset, pose);
  const loop = LOOPING_POSES.has(pose);
  const [frame, setFrame] = useState(() => initialFrame(loop, frames.length));
  // Reset the frame whenever `pose` changes, without a dedicated effect —
  // React's documented pattern for adjusting state during render rather than
  // via a setState-in-effect (see react-hooks/set-state-in-effect).
  const [posedFor, setPosedFor] = useState(pose);
  if (pose !== posedFor) {
    setPosedFor(pose);
    setFrame(initialFrame(loop, frames.length));
  }

  const height = Math.round((size * preset.imageHeight) / preset.imageWidth);

  useEffect(() => {
    if (pose === "idle") return;

    frames.forEach((src) => {
      const image = new window.Image();
      image.src = src;
    });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const timer = window.setInterval(() => {
      setFrame((current) => {
        if (!loop && current >= frames.length - 1) return current;
        return (current + 1) % frames.length;
      });
    }, frameDurationMs);
    return () => window.clearInterval(timer);
  }, [pose, frames, frameDurationMs, loop]);

  const src = frames[Math.min(frame, frames.length - 1)];

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
