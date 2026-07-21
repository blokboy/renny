"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { EnemySprite, SceneBackground } from "@/components/assets";
import { getBattlegroundForStop } from "@/lib/convocation/battleground";
import type { Outcome } from "@/lib/combat/types";
import { WraithEntranceSprite } from "./WraithEntranceSprite";

export interface ConvocationBattleStageProps {
  stopId: number;
  playerSpritePresetId: string;
  /** Fires once both actors have settled into idle (immediately under `prefers-reduced-motion`). */
  onEntranceComplete: () => void;
  /**
   * The Judge's resolved outcome for the current cast, once known — null
   * before a cast resolves. Drives which actor plays the hurt/dying
   * combat-resolution sequence: a "hit" downs the Minotaur, a "miss"/"fail"
   * downs the Wraith (per the design: the fight, not the score text, is
   * the player's primary hit/miss feedback).
   */
  outcome: Outcome | null;
}

const ENTRANCE_DURATION_MS = 900;
const ACTOR_SIZE = 160;

/** Matches the sprite components' own frame counts/pacing (`HURT_FRAME_COUNT` etc. in enemy-presets.ts and `POSE_SEQUENCE` in WraithEntranceSprite) so the hurt→dying handoff lands right as the hurt loop finishes. */
const HURT_FRAME_COUNT = 12;
const POSE_FRAME_DURATION_MS = 90;
const HURT_DURATION_MS = HURT_FRAME_COUNT * POSE_FRAME_DURATION_MS;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface BattleActorProps {
  side: "left" | "right";
  started: boolean;
  children: ReactNode;
}

/**
 * Positions one actor at the stage's left/right edge, grounded at the
 * stage bottom, and slides it in on `started`. Lifted well above the
 * lowest `bottom-8` footing so it clears the fixed prompt bar
 * (`ConvocationEncounter`'s bottom bar) while still reading as standing on
 * the stage ground.
 */
function BattleActor({ side, started, children }: BattleActorProps) {
  const offset = side === "left" ? "-160%" : "160%";
  const positionClasses = side === "left" ? "left-6 sm:left-12" : "right-6 sm:right-12";
  return (
    <div
      className={`absolute bottom-[227px] ${positionClasses}`}
      style={{
        transitionProperty: "transform",
        transitionDuration: `${ENTRANCE_DURATION_MS}ms`,
        transitionTimingFunction: "ease-out",
        transform: started ? "translateX(0)" : `translateX(${offset})`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * The Convocation trial's battle scene: the stop's battleground background,
 * the player's Wraith walking in from the left, and the stop's Minotaur
 * walking in mirrored from the right, both settling into idle before
 * `onEntranceComplete` fires. This component owns staging only — the
 * existing puzzle-solving UI (`ConvocationEncounter`) mounts separately once
 * that fires, per issue #25.
 */
export function ConvocationBattleStage({
  stopId,
  playerSpritePresetId,
  onEntranceComplete,
  outcome,
}: ConvocationBattleStageProps) {
  const { scene, enemyPresetId } = getBattlegroundForStop(stopId);
  const [reduceMotion] = useState(prefersReducedMotion);
  const [started, setStarted] = useState(reduceMotion);
  const [settled, setSettled] = useState(reduceMotion);
  const [defeatPose, setDefeatPose] = useState<"hurt" | "dying">("hurt");
  // Tracks which side `defeatPose` was last set for, so a fresh `outcome`
  // (or reduced motion jumping straight to "dying") can be applied during
  // render rather than via a synchronous setState-in-effect — see the same
  // pattern in `WraithEntranceSprite`/`EnemySprite`'s `posedFor`.
  const [resolvedFor, setResolvedFor] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    if (reduceMotion) {
      onEntranceComplete();
      return;
    }
    const startTimer = window.setTimeout(() => setStarted(true), 30);
    return () => window.clearTimeout(startTimer);
  }, [reduceMotion, onEntranceComplete]);

  useEffect(() => {
    if (reduceMotion || !started) return;
    const settleTimer = window.setTimeout(() => {
      setSettled(true);
      onEntranceComplete();
    }, ENTRANCE_DURATION_MS);
    return () => window.clearTimeout(settleTimer);
  }, [reduceMotion, started, onEntranceComplete]);

  // "hit" downs the Minotaur (right); "miss"/"fail" downs the Wraith (left).
  const defeatedSide: "left" | "right" | null = outcome == null ? null : outcome === "hit" ? "right" : "left";

  if (defeatedSide !== resolvedFor) {
    setResolvedFor(defeatedSide);
    if (defeatedSide) setDefeatPose(reduceMotion ? "dying" : "hurt");
  }

  useEffect(() => {
    if (!defeatedSide || reduceMotion) return;
    const dyingTimer = window.setTimeout(() => setDefeatPose("dying"), HURT_DURATION_MS);
    return () => window.clearTimeout(dyingTimer);
  }, [defeatedSide, reduceMotion]);

  const idlePose = settled ? "idle" : "walking";
  const leftPose = defeatedSide === "left" ? defeatPose : idlePose;
  const rightPose = defeatedSide === "right" ? defeatPose : idlePose;

  return (
    <div className="fixed inset-0 z-20 bg-black">
      <SceneBackground scene={scene} className="absolute inset-0 h-full w-full">
        <BattleActor side="left" started={started}>
          <WraithEntranceSprite presetId={playerSpritePresetId} pose={leftPose} size={ACTOR_SIZE} />
        </BattleActor>

        <BattleActor side="right" started={started}>
          <div className="scale-x-[-1]">
            <EnemySprite presetId={enemyPresetId} pose={rightPose} size={ACTOR_SIZE} />
          </div>
        </BattleActor>
      </SceneBackground>
    </div>
  );
}
