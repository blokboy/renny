"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getSpritePreset } from "@/lib/assets";

export interface PoseSpriteProps {
  presetId: string;
  /**
   * "idle" shows the preset's flat chosen-look image; "walking" loops the
   * walking frame sequence; "hurt"/"dying" play their own frame sequence
   * once and hold on the last frame — combat resolution, see
   * `ConvocationBattleStage` and `GuardianBattle`.
   */
  pose: "idle" | "walking" | "hurt" | "dying";
  /** Rendered width in pixels; height follows the preset's own aspect ratio. Defaults to 128. */
  size?: number;
  className?: string;
}

type AnimatedPose = "walking" | "hurt" | "dying";

const FRAME_DURATION_MS = 90;
/** Poses that loop indefinitely rather than playing once and holding the last frame. */
const LOOPING_POSES = new Set<AnimatedPose>(["walking"]);

interface PoseFamily {
  frameCounts: Record<AnimatedPose, number>;
  frameSrc: (presetId: string, pose: AnimatedPose, frame: number) => string;
}

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

const WRAITH_POSE_FOLDER: Record<AnimatedPose, string> = { walking: "Walking", hurt: "Hurt", dying: "Dying" };
/** The pack's raw frames label "Walking" as "Moving Forward" — folder name and filename label diverge only for this one pose. */
const WRAITH_POSE_LABEL: Record<AnimatedPose, string> = {
  walking: "Moving Forward",
  hurt: "Hurt",
  dying: "Dying",
};

const wraithFamily: PoseFamily = {
  frameCounts: { walking: 12, hurt: 12, dying: 15 },
  frameSrc: (presetId, pose, frame) => {
    const n = wraithNumber(presetId);
    const folder = WRAITH_POSE_FOLDER[pose];
    const label = WRAITH_POSE_LABEL[pose];
    const frameNumber = String(frame).padStart(3, "0");
    return `/assets/character_creation/PNG/Wraith_${n}/PNG Sequences/${folder}/Wraith_${n}_${label}_${frameNumber}.png`;
  },
};

/** Matches a class preset's Idle image path, capturing the `PNG Sequences` base dir and the pack's own filename label (e.g. "Bloody_Alchemist"). */
const CLASS_IDLE_SRC_PATTERN = /^(.*\/PNG Sequences)\/Idle\/0_(.+)_Idle_\d+\.png$/;

/**
 * The 7 class art packs (`public/assets/character_creation/<Class>/...`,
 * see `SPRITE_PRESETS`) share one naming convention, unlike the Wraith
 * pack: folder name and filename label always match, and frame files are
 * prefixed `0_`. The preset's own `imageSrc` (its Idle frame) already
 * encodes the base dir and label, so it's parsed rather than duplicated
 * into a second lookup table.
 */
const classFamily: PoseFamily = {
  frameCounts: { walking: 24, hurt: 12, dying: 15 },
  frameSrc: (presetId, pose, frame) => {
    const preset = getSpritePreset(presetId);
    const match = preset.imageSrc.match(CLASS_IDLE_SRC_PATTERN);
    if (!match) {
      throw new Error(`Preset "${presetId}" has no class-art Idle frame to derive pose paths from`);
    }
    const [, baseDir, label] = match;
    const folder = pose === "walking" ? "Walking" : pose === "hurt" ? "Hurt" : "Dying";
    const frameNumber = String(frame).padStart(3, "0");
    return `${baseDir}/${folder}/0_${label}_${folder}_${frameNumber}.png`;
  },
};

function familyFor(presetId: string): PoseFamily {
  return presetId.startsWith("wraith-") ? wraithFamily : classFamily;
}

/** A non-looping pose (hurt/dying) starts on its last frame under reduced motion — the defeated end state, not a mid-flinch frame. */
function initialFrame(pose: PoseSpriteProps["pose"], family: PoseFamily): number {
  if (pose === "idle") return 0;
  if (LOOPING_POSES.has(pose)) return 0;
  const frameCount = family.frameCounts[pose];
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reduceMotion ? frameCount - 1 : 0;
}

/**
 * Renders any `SPRITE_PRESETS` entry — Wraith or class — in a combat pose:
 * `pose="idle"` shows the same flat preset image `CharacterSprite` renders
 * elsewhere; the other poses cycle a raw frame sequence from the preset's
 * own art pack. This is the single rendering surface for animated combat
 * sprites — `ConvocationBattleStage` and `GuardianBattle` both go through
 * it rather than resolving frame paths themselves.
 *
 * Loops "walking"; "hurt"/"dying" play once and hold their last frame.
 * Under `prefers-reduced-motion`, "walking" holds its first frame and
 * "hurt"/"dying" jump straight to their last (the meaningful end state — a
 * defeated pose — rather than freezing mid-flinch).
 */
export function PoseSprite({ presetId, pose, size = 128, className }: PoseSpriteProps) {
  const preset = getSpritePreset(presetId);
  const family = familyFor(presetId);
  const [frame, setFrame] = useState(() => initialFrame(pose, family));
  // Reset the frame whenever `pose` changes, without a dedicated effect —
  // React's documented pattern for adjusting state during render rather than
  // via a setState-in-effect (see react-hooks/set-state-in-effect).
  const [posedFor, setPosedFor] = useState(pose);
  if (pose !== posedFor) {
    setPosedFor(pose);
    setFrame(initialFrame(pose, family));
  }

  const height = Math.round((size * preset.imageHeight) / preset.imageWidth);

  useEffect(() => {
    if (pose === "idle") return;
    const frameCount = family.frameCounts[pose];
    const loop = LOOPING_POSES.has(pose);

    for (let i = 0; i < frameCount; i++) {
      const image = new window.Image();
      image.src = family.frameSrc(presetId, pose, i);
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
  }, [pose, presetId, family]);

  const src = pose === "idle" ? preset.imageSrc : family.frameSrc(presetId, pose, frame);

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
