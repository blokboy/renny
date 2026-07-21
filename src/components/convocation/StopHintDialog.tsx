"use client";

import { useEffect } from "react";
import type { ConvocationStop } from "@/lib/convocation/stops";

interface StopHintDialogProps {
  stop: ConvocationStop;
  onEnter: () => void;
  onClose: () => void;
}

/**
 * Pre-encounter hint dialog for a stop the player has just unlocked. Shown
 * in place of the old "click = instantly complete" placeholder — "Enter"
 * preserves that same placeholder completion behavior (`ConvocationMap`),
 * it's just gated behind a confirmation now.
 */
export function StopHintDialog({ stop, onEnter, onClose }: StopHintDialogProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stop-hint-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-sm rounded border border-white/30 bg-black p-4 font-mono text-white"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Exit"
          className="absolute -top-3 -right-3 rounded-full border border-white/30 bg-black px-3 py-1 text-xs hover:bg-white/10"
        >
          Exit
        </button>

        <h2 id="stop-hint-dialog-title" className="text-sm tracking-wide text-white/60 uppercase">
          {stop.label}
        </h2>
        <p className="mt-2 text-sm leading-relaxed">{stop.hint}</p>

        <button
          type="button"
          onClick={onEnter}
          className="mt-4 w-full rounded border border-white/30 px-3 py-2 text-sm hover:bg-white/10"
        >
          Enter
        </button>
      </div>
    </div>
  );
}
