"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ConvocationStop } from "@/lib/convocation/stops";
import type { ConvocationCastResponse } from "@/lib/convocation/encounter";

interface ConvocationEncounterProps {
  stop: ConvocationStop;
  onComplete: (xpGained: number) => void;
  onClose: () => void;
}

const OUTCOME_COPY: Record<ConvocationCastResponse["resolution"]["outcome"], string> = {
  hit: "Hit",
  miss: "Miss",
  fail: "Fail",
};

/** Tutorial-phase prompts are capped short — the Convocation is a diagnostic, not a full cast. */
const WORD_LIMIT = 12;

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

export function ConvocationEncounter({ stop, onComplete, onClose }: ConvocationEncounterProps) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cast failed");
    } finally {
      setLoading(false);
    }
  }

  const wordCount = countWords(prompt);

  return (
    <>
      <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto p-3 pb-28 sm:pb-32">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="convocation-encounter-title"
          className="liquid-glass encounter-glass animate-blur-fade-up grid max-h-[calc(100vh-160px)] w-full max-w-2xl grid-rows-[auto_1fr] overflow-hidden rounded-xl font-mono text-sm text-white"
        >
          <header className="flex items-start justify-between gap-3 border-b border-white/15 px-4 py-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="convocation-encounter-title" className="text-lg font-bold">
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
              className="rounded-full border border-white/20 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-40"
            >
              Exit
            </button>
          </header>

          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4 pb-24">
            <div className="flex min-h-0 flex-col gap-4">
              <section className="rounded border border-white/15 bg-black/35 p-4">
                <p className="text-white/70">{stop.puzzle.flavor}</p>
                <p className="mt-3 leading-relaxed">{stop.puzzle.brief}</p>
                {stop.wardLesson && (
                  <p className="mt-3 rounded border border-cyan-300/25 bg-cyan-950/30 p-3 text-cyan-100">
                    {stop.wardLesson}
                  </p>
                )}
              </section>

              {error && <p className="rounded border border-red-400/40 bg-red-950/40 p-3 text-red-100">{error}</p>}
            </div>

            <aside className="flex min-h-0 flex-col gap-3">
              {result && (
                <>
                  <section className="rounded border border-white/15 bg-black/35 p-3">
                    <p className="text-xs tracking-wide text-white/50 uppercase">Familiar output</p>
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-white/85">
                      {result.familiarOutput}
                    </pre>
                  </section>

                  <section className="rounded border border-white/15 bg-black/35 p-3">
                    <p className="text-xs tracking-wide text-white/50 uppercase">Resolution</p>
                    <p className="mt-2 text-xl font-bold">
                      {OUTCOME_COPY[result.resolution.outcome]}
                      {result.resolution.isCrit ? " · Crit" : ""}
                    </p>
                    <p className="text-white/70">Damage {result.resolution.damage}</p>
                    <p className="mt-2 text-white/70">Judge score {result.judge.score}</p>
                    <p className="text-white/70">Elegance {result.judge.elegance}</p>
                    <p className="mt-2 text-white/85">{result.judge.feedback}</p>
                  </section>

                  <section className="rounded border border-emerald-300/25 bg-emerald-950/25 p-3">
                    <p className="text-xs tracking-wide text-emerald-200 uppercase">XP</p>
                    <p className="mt-2 text-xl font-bold text-emerald-100">+{result.xp.gained}</p>
                    <p className="text-white/65">
                      {result.xp.actualTokens}/{result.xp.expectedTokens} prompt tokens · Economy{" "}
                      {Math.round(result.xp.economyBonus * 100)}% · Elegance{" "}
                      {Math.round(result.xp.eleganceBonus * 100)}%
                    </p>
                  </section>

                  <button
                    type="button"
                    onClick={() => onComplete(result.xp.gained)}
                    className="rounded border border-emerald-300/70 px-4 py-2 text-xs text-emerald-100 hover:bg-emerald-300/10"
                  >
                    Record result
                  </button>
                </>
              )}
            </aside>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-30 sm:inset-x-6 sm:bottom-6">
        <form
          onSubmit={handleSubmit}
          className="liquid-glass encounter-glass animate-blur-fade-up mx-auto max-w-2xl rounded-xl p-3"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={prompt}
              onChange={handlePromptChange}
              disabled={loading || result !== null}
              placeholder="Write the one prompt your fixed familiar will cast..."
              className="min-w-0 flex-1 rounded border border-white/15 bg-black/45 px-3 py-2 font-mono text-sm leading-relaxed text-white outline-none focus:border-emerald-300 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim() || result !== null}
              className="shrink-0 rounded bg-emerald-400 px-3 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-35"
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
