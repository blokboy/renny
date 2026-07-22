"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

export type PillTone = "neutral" | "emerald" | "cyan" | "amber" | "red";

const TONE_CLASSES: Record<PillTone, string> = {
  neutral: "border-white/20 bg-white/5 text-white/70",
  emerald: "border-emerald-300/40 bg-emerald-950/30 text-emerald-200",
  cyan: "border-cyan-300/50 bg-cyan-950/50 text-cyan-100",
  amber: "border-amber-300/50 bg-amber-950/25 text-amber-100",
  red: "border-red-400/50 bg-red-950/30 text-red-100",
};

export interface PillProps {
  tone?: PillTone;
  /** Hover tooltip content, portaled to `document.body` so a panel's `overflow-hidden` (needed for the liquid-glass edge) doesn't clip it. */
  tooltip?: string;
  children: React.ReactNode;
}

/** Shared rounded-pill tag — backs family/preview/status labels across every combat screen. */
export function Pill({ tone = "neutral", tooltip, children }: PillProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  function showTooltip() {
    if (!tooltip) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setTooltipPos({ top: rect.top, left: rect.left + rect.width / 2 });
  }

  return (
    <span
      ref={ref}
      onMouseEnter={showTooltip}
      onMouseLeave={() => setTooltipPos(null)}
      className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[9px] tracking-wide uppercase ${TONE_CLASSES[tone]}`}
    >
      {children}
      {tooltipPos &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            className="pointer-events-none fixed z-50 mt-[-8px] w-56 -translate-x-1/2 -translate-y-full rounded border border-emerald-300/30 bg-zinc-950 p-2 text-[10px] font-normal tracking-normal text-emerald-100 normal-case shadow-lg"
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
          >
            {tooltip}
          </span>,
          document.body,
        )}
    </span>
  );
}
