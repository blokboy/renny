"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { RotateCw } from "lucide-react";

export interface PortraitGateProps {
  children: ReactNode;
}

function isMobilePortrait(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(orientation: portrait)").matches;
}

/**
 * Blocks entry into a Convocation trial (Puzzle Room) while a touch device
 * is held in portrait orientation — a mid-stream requirement added to issue
 * #25 after the original acceptance criteria were written (see the issue
 * comment). Shows a modal that only dismisses once landscape is detected,
 * then renders `children` (the battle stage + puzzle UI).
 *
 * Only gates the moment of entry: once unlocked for this trial, rotating
 * back to portrait mid-trial doesn't re-block — that would discard
 * in-progress puzzle state, which the requirement didn't ask for.
 */
export function PortraitGate({ children }: PortraitGateProps) {
  const [unlocked, setUnlocked] = useState(() => !isMobilePortrait());

  useEffect(() => {
    if (unlocked) return;

    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const orientationQuery = window.matchMedia("(orientation: portrait)");
    const check = () => {
      if (!(pointerQuery.matches && orientationQuery.matches)) setUnlocked(true);
    };

    check();
    pointerQuery.addEventListener("change", check);
    orientationQuery.addEventListener("change", check);
    return () => {
      pointerQuery.removeEventListener("change", check);
      orientationQuery.removeEventListener("change", check);
    };
  }, [unlocked]);

  if (!unlocked) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black p-6 text-center text-white"
      >
        <RotateCw size={40} className="text-white/70" aria-hidden="true" />
        <p className="text-sm tracking-[0.2em] uppercase">Turn your phone sideways</p>
        <p className="max-w-xs text-xs text-zinc-400">
          This trial needs a landscape view to fit the battle stage. Rotate your device to continue.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
