"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { BackgroundVideo } from "@/components/BackgroundVideo";
import { SPRITE_PRESETS } from "@/lib/assets";
import { getCharacterDraft } from "@/lib/character";
import { CONVOCATION_STOPS } from "@/lib/convocation/stops";
import {
  completeStop,
  getConvocationProgressSnapshot,
  getConvocationProgressServerSnapshot,
  resetConvocationProgress,
  subscribeToConvocationProgress,
} from "@/lib/convocation/progress";
import { ConvocationBattleStage } from "./ConvocationBattleStage";
import { ConvocationEncounter } from "./ConvocationEncounter";
import { ConvocationClassChoice } from "./ConvocationClassChoice";
import { ConvocationTrialCard, type TrialCardState } from "./ConvocationTrialCard";
import { PortraitGate } from "./PortraitGate";

function stopState(stopId: number, completedThrough: number): TrialCardState {
  if (stopId <= completedThrough) return "completed";
  if (stopId === completedThrough + 1) return "current";
  return "locked";
}

export function ConvocationMap() {
  const router = useRouter();
  const progress = useSyncExternalStore(
    subscribeToConvocationProgress,
    getConvocationProgressSnapshot,
    getConvocationProgressServerSnapshot,
  );
  const [encounterStopId, setEncounterStopId] = useState<number | null>(null);
  const [entranceComplete, setEntranceComplete] = useState(false);

  useEffect(() => {
    if (progress.completedThrough >= CONVOCATION_STOPS.length && !getCharacterDraft()) {
      router.replace("/character/create");
    }
  }, [progress.completedThrough, router]);

  function handleStopClick(stopId: number, state: TrialCardState) {
    if (state !== "current") return;
    setEntranceComplete(false);
    setEncounterStopId(stopId);
  }

  function handleComplete(stopId: number, xpGained: number) {
    completeStop(stopId, xpGained);
    setEncounterStopId(null);
    setEntranceComplete(false);
  }

  function handleClose() {
    setEncounterStopId(null);
    setEntranceComplete(false);
  }

  const encounterStop = CONVOCATION_STOPS.find((stop) => stop.id === encounterStopId) ?? null;
  const playerSpritePresetId = getCharacterDraft()?.sprite.presetId ?? SPRITE_PRESETS[0].id;
  const handleEntranceComplete = useCallback(() => setEntranceComplete(true), []);

  return (
    <div className="font-early-gameboy relative isolate h-full w-full overflow-hidden bg-black text-white">
      <BackgroundVideo />
      <div className="bottom-blur-mask fixed inset-0 z-[1] pointer-events-none" aria-hidden="true" />
      <div className="fixed inset-0 z-[2] bg-black/35" aria-hidden="true" />

      <div className="relative z-10 flex h-full flex-col overflow-y-auto px-4 py-5 sm:px-8 sm:py-7 lg:px-12 lg:py-9">
        <header className="flex shrink-0 items-start justify-between gap-4">
          <div>
            <p className="text-[9px] tracking-[0.25em] text-[#d6b5e8] uppercase">
              The Convocation
            </p>
            <h1 className="font-grape-soda mt-2 text-4xl leading-none text-[#fff6d5] drop-shadow-[0_3px_0_#713c91] sm:text-5xl">
              Trial Path
            </h1>
            <p className="mt-3 text-[9px] tracking-[0.12em] text-zinc-300 uppercase">
              {progress.completedThrough} / {CONVOCATION_STOPS.length} complete · {progress.totalXp} XP banked
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/25 bg-black/30 px-3 py-2 text-[8px] tracking-[0.12em] text-zinc-300 uppercase backdrop-blur transition hover:border-white/50 hover:text-white"
            onClick={() => resetConvocationProgress()}
          >
            Reset
          </button>
        </header>

        <div className="mt-8 min-h-0 flex-1 overflow-y-auto sm:mt-10 sm:flex sm:items-center sm:overflow-x-auto sm:overflow-y-hidden sm:pb-5">
          <ol className="mx-auto flex w-full max-w-xl flex-col gap-4 sm:mx-0 sm:w-max sm:max-w-none sm:flex-row">
            {CONVOCATION_STOPS.map((stop) => {
              const state = stopState(stop.id, progress.completedThrough);

              return (
                <li
                  key={stop.id}
                  className="w-full sm:w-52 sm:shrink-0 lg:w-56"
                >
                  <ConvocationTrialCard
                    stop={stop}
                    state={state}
                    onEnter={() => handleStopClick(stop.id, state)}
                  />
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {encounterStop && (
        <PortraitGate key={encounterStop.id}>
          <ConvocationBattleStage
            stopId={encounterStop.id}
            playerSpritePresetId={playerSpritePresetId}
            onEntranceComplete={handleEntranceComplete}
          />

          {entranceComplete && (
            <ConvocationEncounter
              stop={encounterStop}
              onComplete={(xpGained) => handleComplete(encounterStop.id, xpGained)}
              onClose={handleClose}
            />
          )}
        </PortraitGate>
      )}

      {progress.completedThrough >= CONVOCATION_STOPS.length && !encounterStop && (
        <ConvocationClassChoice totalXp={progress.totalXp} />
      )}
    </div>
  );
}
