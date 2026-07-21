"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ConvocationStop } from "@/lib/convocation/stops";
import type { ConvocationCastResponse } from "@/lib/convocation/encounter";
import type { Outcome } from "@/lib/combat/types";
import { HUD_FOOTPRINT_PX } from "./ConvocationHud";

interface ConvocationEncounterProps {
  stop: ConvocationStop;
  onComplete: (xpGained: number) => void;
  onClose: () => void;
  /** Fires the moment the Judge's outcome is known, before the player reads it — drives the sprites' combat reaction (see `ConvocationBattleStage`) and the HUD's health drain. */
  onResolved?: (outcome: Outcome) => void;
}

const OUTCOME_COPY: Record<Outcome, string> = {
  hit: "Hit",
  miss: "Miss",
  fail: "Fail",
};

const OUTCOME_TONE: Record<Outcome, string> = {
  hit: "border-emerald-300/60 bg-emerald-950/25 text-emerald-100",
  miss: "border-amber-300/50 bg-amber-950/25 text-amber-100",
  fail: "border-red-400/50 bg-red-950/30 text-red-100",
};

/** Tutorial-phase prompts are capped short — the Convocation is a diagnostic, not a full cast. */
const WORD_LIMIT = 12;

/** Clearance the puzzle panel keeps from each `ConvocationHud` block. */
const PANEL_HUD_GAP_PX = 3;
const PANEL_INSET_STYLE = {
  "--panel-inset-x": `${HUD_FOOTPRINT_PX.base + PANEL_HUD_GAP_PX}px`,
  "--panel-inset-x-sm": `${HUD_FOOTPRINT_PX.sm + PANEL_HUD_GAP_PX}px`,
} as React.CSSProperties;

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

interface FamilyPillProps {
  family: string;
  probeReveal: string;
}

/**
 * The puzzle-type pill, with the probe hint shown on hover. Portaled to
 * `document.body` rather than positioned as a normal absolute descendant —
 * the panel's `overflow-hidden` (needed for the liquid-glass edge) would
 * otherwise clip a tooltip that pops out above the pill.
 */
function FamilyPill({ family, probeReveal }: FamilyPillProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  function showTooltip() {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({ top: rect.top, left: rect.left + rect.width / 2 });
    }
  }

  return (
    <span
      ref={ref}
      onMouseEnter={showTooltip}
      onMouseLeave={() => setTooltipPos(null)}
      className="rounded-full border border-emerald-300/40 bg-emerald-950/30 px-2.5 py-0.5 text-[9px] tracking-wide text-emerald-200 uppercase"
    >
      {family}
      {tooltipPos &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            className="pointer-events-none fixed z-50 mt-[-8px] w-56 -translate-x-1/2 -translate-y-full rounded border border-emerald-300/30 bg-zinc-950 p-2 text-[10px] font-normal tracking-normal text-emerald-100 normal-case shadow-lg"
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
          >
            {probeReveal}
          </span>,
          document.body,
        )}
    </span>
  );
}

interface JudgeDialogProps {
  loading: boolean;
  error: string | null;
  result: ConvocationCastResponse | null;
  onContinue: (xpGained: number) => void;
}

/**
 * A second dialog, stacked below the puzzle panel, that owns the cast's
 * outcome — separate from the panel (which only ever shows the puzzle
 * itself) so the panel doesn't grow/shrink as a cast resolves. Walks
 * loading -> error | result; renders nothing before the first cast.
 */
function JudgeDialog({ loading, error, result, onContinue }: JudgeDialogProps) {
  return (
    <section
      aria-live="polite"
      className="liquid-glass encounter-glass animate-blur-fade-up w-full max-w-2xl rounded-xl p-3 font-mono text-sm text-white sm:p-4"
    >
      <p className="text-[9px] tracking-[0.25em] text-white/50 uppercase">The Judge</p>

      {loading && (
        <p className="mt-2 flex items-center gap-2 text-white/75">
          <span className="flex h-2 w-2 animate-ping rounded-full bg-emerald-300" />
          Analyzing your cast...
        </p>
      )}

      {!loading && error && (
        <p className="mt-2 rounded border border-red-400/40 bg-red-950/40 p-3 text-red-100">{error}</p>
      )}

      {!loading && result && (
        <div className="mt-2 flex flex-col gap-3">
          <section className={`rounded border p-3 ${OUTCOME_TONE[result.resolution.outcome]}`}>
            <p className="text-xl font-bold">
              {OUTCOME_COPY[result.resolution.outcome]}
              {result.resolution.isCrit ? " · Crit" : ""}
            </p>
            <p className="mt-2 opacity-90">{result.judge.feedback}</p>
            <p className="mt-2 text-[10px] tracking-wide uppercase opacity-70">
              Score {Math.round(result.judge.score * 100)} · Elegance {Math.round(result.judge.elegance * 100)} ·
              Damage {result.resolution.damage}
            </p>
          </section>

          <section className="rounded border border-white/15 bg-black/35 p-3">
            <p className="text-xs tracking-wide text-white/50 uppercase">Familiar output</p>
            <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-white/85">
              {result.familiarOutput}
            </pre>
          </section>

          <section className="rounded border border-emerald-300/25 bg-emerald-950/25 p-3">
            <p className="text-xs tracking-wide text-emerald-200 uppercase">XP</p>
            <p className="mt-2 text-xl font-bold text-emerald-100">+{result.xp.gained}</p>
            <p className="text-white/65">
              {result.xp.actualTokens}/{result.xp.expectedTokens} prompt tokens · Economy{" "}
              {Math.round(result.xp.economyBonus * 100)}% · Elegance {Math.round(result.xp.eleganceBonus * 100)}%
            </p>
          </section>

          <button
            type="button"
            onClick={() => onContinue(result.xp.gained)}
            className="self-start rounded border border-emerald-300/70 px-4 py-2 text-xs text-emerald-100 hover:bg-emerald-300/10"
          >
            Continue
          </button>
        </div>
      )}
    </section>
  );
}

export function ConvocationEncounter({ stop, onComplete, onClose, onResolved }: ConvocationEncounterProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvocationCastResponse | null>(null);

  function handlePromptChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    if (countWords(value) <= WORD_LIMIT) {
      setPrompt(value);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (result) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/convocation/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopId: stop.id, prompt }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Cast failed");
      }
      setResult(data);
      onResolved?.(data.resolution.outcome);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cast failed");
    } finally {
      setLoading(false);
    }
  }

  const wordCount = countWords(prompt);
  const showJudgeDialog = loading || error !== null || result !== null;

  return (
    <>
      <div
        className="fixed inset-0 z-30 flex flex-col items-center justify-start gap-3 overflow-y-auto px-[var(--panel-inset-x)] pt-3 pb-3 sm:px-[var(--panel-inset-x-sm)] sm:pt-6"
        style={PANEL_INSET_STYLE}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="convocation-encounter-title"
          className="liquid-glass encounter-glass animate-blur-fade-up grid max-h-[40vh] w-full max-w-2xl grid-rows-[auto_1fr] overflow-hidden rounded-xl font-mono text-sm text-white"
        >
          <header className="flex items-start justify-between gap-2 border-b border-white/15 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 id="convocation-encounter-title" className="text-sm font-bold sm:text-lg">
                  {stop.puzzle.title}
                </h2>
                <FamilyPill family={stop.family} probeReveal={stop.probeReveal} />
                <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-[9px] tracking-wide text-white/70 uppercase">
                  {stop.preview}
                </span>
              </div>
              <p className="mt-1 text-xs text-white/55">{stop.hint} One prompt. One cast.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="shrink-0 rounded-full border border-white/20 px-2 py-1.5 text-xs hover:bg-white/10 disabled:opacity-40 sm:px-3 sm:py-2"
            >
              Exit
            </button>
          </header>

          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-3 sm:p-4">
            <section className="rounded border border-white/15 bg-black/35 p-4">
              <p className="text-white/70">{stop.puzzle.flavor}</p>
              <p className="mt-3 leading-relaxed">{stop.puzzle.brief}</p>
              {stop.wardLesson && (
                <p className="mt-3 rounded border border-cyan-300/25 bg-cyan-950/30 p-3 text-cyan-100">
                  {stop.wardLesson}
                </p>
              )}
            </section>
          </div>
        </section>

        {showJudgeDialog && (
          <JudgeDialog loading={loading} error={error} result={result} onContinue={onComplete} />
        )}
      </div>

      <div className="fixed inset-x-2 bottom-2 z-30 sm:inset-x-6 sm:bottom-6">
        <form
          onSubmit={handleSubmit}
          className="liquid-glass encounter-glass animate-blur-fade-up mx-auto max-w-2xl rounded-xl p-2 sm:p-3"
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <input
              type="text"
              value={prompt}
              onChange={handlePromptChange}
              disabled={loading || result !== null}
              placeholder="Write the one prompt your fixed familiar will cast..."
              className="min-w-0 flex-1 rounded border border-white/15 bg-black/45 px-2 py-1.5 font-mono text-sm leading-relaxed text-white outline-none focus:border-emerald-300 disabled:opacity-60 sm:px-3 sm:py-2"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim() || result !== null}
              className="shrink-0 rounded bg-emerald-400 px-2 py-1.5 text-xs font-bold text-zinc-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-35 sm:px-3 sm:py-2"
            >
              {loading ? "Casting..." : "Cast"}
            </button>
          </div>
          <p
            className={`mt-1.5 text-[10px] tracking-wide uppercase ${
              wordCount >= WORD_LIMIT ? "text-red-300" : "text-white/50"
            }`}
          >
            {wordCount} / {WORD_LIMIT} words
          </p>
        </form>
      </div>
    </>
  );
}
