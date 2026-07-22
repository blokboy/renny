"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BackgroundVideo } from "@/components/BackgroundVideo";
import { getCharacterDraft, saveCharacterDraft } from "@/lib/character";

const FRAME_COUNT = 12;
const FRAME_DURATION_MS = 90;
const TRANSITION_DURATION_MS = 8000;

const WRAITH_NAMES: Record<number, string> = {
  1: "Verdant Wraith",
  2: "Ember Wraith",
  3: "Umbral Wraith",
};

function walkingFrame(wraithNumber: number, frame: number): string {
  const wraith = String(wraithNumber).padStart(2, "0");
  const frameNumber = String(frame).padStart(3, "0");
  return `/assets/character_creation/PNG/Wraith_${wraith}/PNG Sequences/Walking/Wraith_${wraith}_Moving Forward_${frameNumber}.png`;
}

export function LoadingTransition({ wraithNumber }: { wraithNumber: number }) {
  const router = useRouter();
  const [frame, setFrame] = useState(0);
  const frames = useMemo(
    () => Array.from({ length: FRAME_COUNT }, (_, index) => walkingFrame(wraithNumber, index)),
    [wraithNumber],
  );

  useEffect(() => {
    if (!getCharacterDraft()) {
      const wraith = String(wraithNumber).padStart(2, "0");
      saveCharacterDraft({
        name: "",
        sprite: { presetId: `wraith-${wraith}` },
        createdAt: new Date().toISOString(),
      });
    }
  }, [wraithNumber]);

  useEffect(() => {
    frames.forEach((src) => {
      const image = new window.Image();
      image.src = src;
    });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animationTimer = reduceMotion
      ? undefined
      : window.setInterval(() => setFrame((current) => (current + 1) % FRAME_COUNT), FRAME_DURATION_MS);
    const transitionTimer = window.setTimeout(() => router.replace("/convocation"), TRANSITION_DURATION_MS);

    return () => {
      if (animationTimer !== undefined) window.clearInterval(animationTimer);
      window.clearTimeout(transitionTimer);
    };
  }, [frames, router]);

  return (
    <main className="font-early-gameboy relative isolate flex h-svh overflow-hidden bg-black px-5 py-8 text-[#fff6d5] sm:px-8 sm:py-10 lg:px-12 lg:py-12">
      <BackgroundVideo />
      <div className="bottom-blur-mask fixed inset-0 z-[1] pointer-events-none" aria-hidden="true" />
      <div className="fixed inset-0 z-[2] bg-black/20" aria-hidden="true" />

      <section className="relative z-10 m-auto flex w-full max-w-xl flex-col items-center text-center sm:mt-auto sm:mr-auto sm:-mb-5 sm:ml-0 sm:max-w-5xl sm:flex-row sm:items-end sm:gap-3 sm:text-left lg:-mb-7 lg:gap-5">
        <div className="relative flex w-full shrink-0 items-end justify-center sm:w-[140px] lg:w-[170px]">
          <div className="absolute bottom-1 h-4 w-24 rounded-[50%] bg-black/60 blur-sm" aria-hidden="true" />
          <Image
            src={frames[frame]}
            alt={`${WRAITH_NAMES[wraithNumber]} walking toward the Convocation`}
            width={520}
            height={420}
            priority
            unoptimized
            className="relative h-auto w-full max-w-[140px] select-none object-contain sm:max-w-none [image-rendering:auto]"
          />
        </div>

        <div className="w-full max-w-xl sm:pb-0">
          <p className="mb-4 text-xs tracking-[0.32em] text-[#cda8e1] uppercase">
            Preparing passage
          </p>
          <h1 className="font-grape-soda text-5xl leading-[0.9] text-[#fff6d5] drop-shadow-[0_3px_0_#713c91] sm:text-6xl lg:text-7xl">
            The Convocation Trial awaits
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-zinc-200 sm:mx-0 sm:mt-6 sm:text-base">
            Eight prompt puzzles stand between you and the right to shape your hero. Read closely,
            think deliberately, and prove your command of the craft.
          </p>

          <div className="mt-7 flex flex-col items-center gap-4 sm:mt-8 sm:items-start">
            <div className="h-1 w-full max-w-sm overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <span className="loading-progress block h-full origin-left bg-gradient-to-r from-[#713c91] to-[#e5b7ff]" />
            </div>
            <button
              type="button"
              onClick={() => router.replace("/convocation")}
              className="text-xs tracking-[0.2em] text-zinc-400 uppercase transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e5b7ff]"
            >
              Enter now →
            </button>
          </div>
        </div>
      </section>

      <p className="absolute right-0 bottom-3 left-0 z-10 text-center text-[10px] tracking-[0.25em] text-zinc-400 uppercase sm:right-8 sm:bottom-5 sm:left-auto lg:right-12">
        Your guide: {WRAITH_NAMES[wraithNumber]}
      </p>
    </main>
  );
}
