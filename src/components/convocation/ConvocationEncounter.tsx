"use client";

import { useState } from "react";
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

export function ConvocationEncounter({ stop, onComplete, onClose }: ConvocationEncounterProps) {
  const [prompt, setPrompt] = useState("");
  const [probeOpen, setProbeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvocationCastResponse | null>(null);

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

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto p-3 pt-6 pb-28 sm:items-center sm:pt-10 sm:pb-32">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="convocation-encounter-title"
        className="liquid-glass encounter-glass animate-blur-fade-up grid max-h-[78vh] w-full max-w-5xl grid-rows-[auto_1fr] overflow-hidden rounded-xl font-mono text-sm text-white"
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/15 px-4 py-3">
          <div>
            <p className="text-xs tracking-wide text-emerald-300 uppercase">
              {stop.label} · {stop.boundFamiliar}
            </p>
            <h2 id="convocation-encounter-title" className="mt-1 text-lg font-bold">
              {stop.puzzle.title}
            </h2>
            <p className="mt-1 text-xs text-white/55">Family tag hidden until probed</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded border border-white/20 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-40"
          >
            Exit
          </button>
        </header>

        <div className="grid min-h-0 gap-4 overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
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

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                disabled={loading || result !== null}
                placeholder="Write the one prompt your fixed familiar will cast..."
                className="min-h-36 resize-y rounded border border-white/15 bg-black/45 p-3 leading-relaxed text-white outline-none focus:border-emerald-300 disabled:opacity-60"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setProbeOpen(true)}
                  disabled={probeOpen || result !== null}
                  className="rounded border border-white/20 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-40"
                >
                  Probe
                </button>
                <button
                  type="submit"
                  disabled={loading || !prompt.trim() || result !== null}
                  className="rounded bg-emerald-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {loading ? "Casting..." : "Cast once"}
                </button>
                {result && (
                  <button
                    type="button"
                    onClick={() => onComplete(result.xp.gained)}
                    className="rounded border border-emerald-300/70 px-4 py-2 text-xs text-emerald-100 hover:bg-emerald-300/10"
                  >
                    Record result
                  </button>
                )}
              </div>
            </form>

            {probeOpen && (
              <section className="rounded border border-amber-300/30 bg-amber-950/30 p-3 text-amber-100">
                <p>{stop.probeReveal}</p>
              </section>
            )}

            {error && <p className="rounded border border-red-400/40 bg-red-950/40 p-3 text-red-100">{error}</p>}
          </div>

          <aside className="flex min-h-0 flex-col gap-3">
            <section className="rounded border border-white/15 bg-black/35 p-3">
              <p className="text-xs tracking-wide text-white/50 uppercase">Preview</p>
              <p className="mt-2 text-lg text-emerald-200">{stop.preview}</p>
              <p className="mt-1 text-white/65">{stop.hint}</p>
            </section>

            {result ? (
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
              </>
            ) : (
              <section className="rounded border border-white/15 bg-black/35 p-3 text-white/60">
                One prompt. One cast. The hidden family remains unnamed unless you Probe.
              </section>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
