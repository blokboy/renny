"use client";

import { useState } from "react";
import type { ConvocationStop } from "@/lib/convocation/stops";
import type { ConvocationCastResponse } from "@/lib/convocation/encounter";
import type { Outcome } from "@/lib/combat/types";
import { Pill, PuzzlePanel, PuzzlePanelHeader, type PanelInsets } from "@/components/combat";

interface ConvocationEncounterProps {
  stop: ConvocationStop;
  onComplete: (xpGained: number) => void;
  onClose: () => void;
  /** Fires the moment the Judge's outcome is known, before the player reads it — drives the sprites' combat reaction (see `ConvocationBattleStage`) and the HUD's health drain. */
  onResolved?: (outcome: Outcome) => void;
  /** Fires when the player retries after a non-Hit outcome — clears the sprites'/HUD's combat reaction back to neutral for the new attempt. */
  onRetry?: () => void;
  /** Live-measured clearance from each `ConvocationHud` card — see `usePanelInsets`, computed by `ConvocationMap`. */
  insets: PanelInsets;
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

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

interface JudgeAnalysisProps {
  loading: boolean;
  error: string | null;
  result: ConvocationCastResponse | null;
  onContinue: (xpGained: number) => void;
  onRetry: () => void;
}

/**
 * The cast's outcome, rendered inline in the puzzle panel's body (swapped
 * in for the puzzle text via the panel's view toggle) rather than as its
 * own stacked container — keeps a single glass panel on screen instead of
 * two, which is most of the vertical space this saves. Walks loading ->
 * error | result.
 */
function JudgeAnalysis({ loading, error, result, onContinue, onRetry }: JudgeAnalysisProps) {
  return (
    <div aria-live="polite" className="flex flex-col gap-2">
      <p className="text-[9px] tracking-[0.25em] text-white/50 uppercase">The Judge</p>

      {loading && (
        <p className="flex items-center gap-2 text-white/75">
          <span className="flex h-2 w-2 animate-ping rounded-full bg-emerald-300" />
          Analyzing your cast...
        </p>
      )}

      {!loading && error && (
        <p className="rounded border border-red-400/40 bg-red-950/40 p-3 text-red-100">{error}</p>
      )}

      {!loading && result && (
        <div className="flex flex-col gap-3">
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

          {result.resolution.outcome === "hit" ? (
            <button
              type="button"
              onClick={() => onContinue(result.xp.gained)}
              className="self-start rounded border border-emerald-300/70 px-4 py-2 text-xs text-emerald-100 hover:bg-emerald-300/10"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={onRetry}
              className="self-start rounded border border-amber-300/70 px-4 py-2 text-xs text-amber-100 hover:bg-amber-300/10"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ConvocationEncounter({ stop, onComplete, onClose, onResolved, onRetry, insets }: ConvocationEncounterProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvocationCastResponse | null>(null);
  /** Toggles the panel body between the puzzle brief and the Judge's analysis — see `showJudgeDialog` below. */
  const [view, setView] = useState<"puzzle" | "judge">("puzzle");

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
    setView("judge");

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

  function handleRetry() {
    setPrompt("");
    setError(null);
    setResult(null);
    setView("puzzle");
    onRetry?.();
  }

  const wordCount = countWords(prompt);
  const showJudgeDialog = loading || error !== null || result !== null;

  return (
    <>
      <div
        className="fixed inset-0 z-30 flex flex-col items-center justify-start gap-3 overflow-y-auto pt-3 pb-3 sm:pt-6"
        style={{ paddingLeft: insets.left, paddingRight: insets.right }}
      >
        <PuzzlePanel
          titleId="convocation-encounter-title"
          className="h-[50vh] w-full max-w-2xl sm:h-auto sm:max-h-[50vh]"
        >
          <PuzzlePanelHeader
            titleId="convocation-encounter-title"
            title={stop.puzzle.title}
            onClose={onClose}
            closeDisabled={loading}
            titleAdornment={
              <Pill tone="emerald" tooltip={stop.probeReveal}>
                {stop.family}
              </Pill>
            }
          />

          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-3 pt-1 pb-3 sm:px-4 sm:pt-2 sm:pb-4">
            {showJudgeDialog && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setView(view === "judge" ? "puzzle" : "judge")}
                  className="shrink-0 rounded-full border border-white/20 px-2.5 py-0.5 text-[9px] tracking-wide uppercase hover:bg-white/10"
                >
                  {view === "judge" ? "Puzzle" : "Result"}
                </button>
              </div>
            )}

            {view === "judge" && showJudgeDialog ? (
              <JudgeAnalysis
                loading={loading}
                error={error}
                result={result}
                onContinue={onComplete}
                onRetry={handleRetry}
              />
            ) : (
              <section className="rounded border border-white/15 bg-black/35 p-4">
                <p className="leading-relaxed">{stop.puzzle.brief}</p>
                {stop.wardLesson && (
                  <p className="mt-3 rounded border border-cyan-300/25 bg-cyan-950/30 p-3 text-cyan-100">
                    {stop.wardLesson}
                  </p>
                )}
              </section>
            )}
          </div>
        </PuzzlePanel>
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
