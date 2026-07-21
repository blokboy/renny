"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { EnemySprite, SceneBackground } from "@/components/assets";
import { getBattlegroundForStop } from "@/lib/convocation/battleground";
import { WraithEntranceSprite } from "./WraithEntranceSprite";

export interface ConvocationBattleStageProps {
  stopId: number;
  playerSpritePresetId: string;
  /** Fires once both actors have settled into idle (immediately under `prefers-reduced-motion`). */
  onEntranceComplete: () => void;
}

const ENTRANCE_DURATION_MS = 900;
const ACTOR_SIZE = 160;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface BattleActorProps {
  side: "left" | "right";
  started: boolean;
  children: ReactNode;
}

/** Positions one actor at the stage's left/right edge and slides it in on `started`. */
function BattleActor({ side, started, children }: BattleActorProps) {
  const offset = side === "left" ? "-160%" : "160%";
  const positionClasses = side === "left" ? "left-6 sm:left-12" : "right-6 sm:right-12";
  return (
    <div
      className={`absolute bottom-8 ${positionClasses}`}
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
export function ConvocationBattleStage({ stopId, playerSpritePresetId, onEntranceComplete }: ConvocationBattleStageProps) {
  const { scene, enemyPresetId } = getBattlegroundForStop(stopId);
  const [reduceMotion] = useState(prefersReducedMotion);
  const [started, setStarted] = useState(reduceMotion);
  const [settled, setSettled] = useState(reduceMotion);

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

  const pose = settled ? "idle" : "walking";

  return (
    <div className="fixed inset-0 z-20 bg-black">
      <SceneBackground scene={scene} className="absolute inset-0 h-full w-full">
        <BattleActor side="left" started={started}>
          <WraithEntranceSprite presetId={playerSpritePresetId} pose={pose} size={ACTOR_SIZE} />
        </BattleActor>

        <BattleActor side="right" started={started}>
          <div className="scale-x-[-1]">
            <EnemySprite presetId={enemyPresetId} pose={pose} size={ACTOR_SIZE} />
          </div>
        </BattleActor>
      </SceneBackground>
    </div>
  );
}
