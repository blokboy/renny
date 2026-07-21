"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { SceneBackground } from "@/components/assets";
import { TUTORIAL_ZONE_BACKGROUND } from "@/lib/assets";
import { CONVOCATION_STOPS } from "@/lib/convocation/stops";
import {
  completeStop,
  getConvocationProgressSnapshot,
  getConvocationProgressServerSnapshot,
  resetConvocationProgress,
  subscribeToConvocationProgress,
} from "@/lib/convocation/progress";
import { ConvocationEncounter } from "./ConvocationEncounter";

type StopState = "completed" | "current" | "locked";

function stopState(stopId: number, completedThrough: number): StopState {
  if (stopId <= completedThrough) return "completed";
  if (stopId === completedThrough + 1) return "current";
  return "locked";
}

export function ConvocationMap() {
  const progress = useSyncExternalStore(
    subscribeToConvocationProgress,
    getConvocationProgressSnapshot,
    getConvocationProgressServerSnapshot,
  );
  const [encounterStopId, setEncounterStopId] = useState<number | null>(null);

  function handleStopClick(stopId: number, state: StopState) {
    if (state !== "current") return;
    setEncounterStopId(stopId);
  }

  function handleComplete(stopId: number, xpGained: number) {
    completeStop(stopId, xpGained);
    setEncounterStopId(null);
  }

  const encounterStop = CONVOCATION_STOPS.find((stop) => stop.id === encounterStopId) ?? null;

  return (
    <SceneBackground scene={TUTORIAL_ZONE_BACKGROUND} className="h-full w-full">
      <div className="absolute inset-x-2 top-2 z-10 flex items-center justify-between rounded bg-black/50 px-2 py-1 font-mono text-sm text-white">
        <span>
          {progress.completedThrough} / {CONVOCATION_STOPS.length} stops complete ·{" "}
          {progress.totalXp} XP banked
        </span>
        <button
          type="button"
          className="rounded border border-white/30 px-2 py-1"
          onClick={() => resetConvocationProgress()}
        >
          Reset progress
        </button>
      </div>

      {CONVOCATION_STOPS.map((stop) => {
          const state = stopState(stop.id, progress.completedThrough);
          const badgeSrc =
            state === "completed"
              ? "/assets/convocation/markers/badge-complete.png"
              : "/assets/convocation/markers/badge-locked.png";
          const numSrc =
            state === "locked"
              ? `/assets/convocation/markers/num0${stop.id}-gray.png`
              : `/assets/convocation/markers/num0${stop.id}.png`;

          return (
            <button
              key={stop.id}
              type="button"
              aria-label={`${stop.label} (${state})`}
              title={`${stop.label} (${state})`}
              disabled={state === "locked"}
              onClick={() => handleStopClick(stop.id, state)}
              className="absolute -translate-x-1/2 -translate-y-1/2 disabled:cursor-not-allowed"
              style={{ left: `${stop.position.xPercent}%`, top: `${stop.position.yPercent}%` }}
            >
              <span
                className={`relative block h-11 w-11 ${
                  state === "locked" ? "opacity-40 grayscale" : ""
                }`}
              >
                <Image src={badgeSrc} alt="" fill sizes="44px" className="object-contain" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src={numSrc}
                    alt={stop.label}
                    width={16}
                    height={22}
                    className="h-[22px] w-4 object-contain"
                  />
                </span>
              </span>
            </button>
          );
        })}

      {encounterStop && (
        <ConvocationEncounter
          stop={encounterStop}
          onComplete={(xpGained) => handleComplete(encounterStop.id, xpGained)}
          onClose={() => setEncounterStopId(null)}
        />
      )}
    </SceneBackground>
  );
}
