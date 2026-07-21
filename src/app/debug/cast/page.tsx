"use client";

import { useState } from "react";
import { DEMO_PUZZLE } from "@/lib/combat/puzzles";
import type { CastResult } from "@/lib/combat/types";
import { getCharacter } from "@/lib/character/storage";
import { getTokenBudget } from "@/lib/character/tokens";
import type { CharacterRecord } from "@/lib/character/types";

export default function DebugCastPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CastResult | null>(null);
  // Issue #5: stats (INT token budget, STR/LCK resolution) come from the
  // locally-persisted character, read once via a lazy initializer same as
  // `RecapView` — avoids a setState-in-effect render cascade.
  const [character] = useState<CharacterRecord | null>(() => getCharacter());

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, casterStats: character?.stats }),
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
    <main className="mx-auto max-w-2xl flex-1 p-8 font-mono text-sm">
      <h1 className="mb-4 text-lg font-bold">Cast-and-Judge Debug</h1>

      <section className="mb-6 rounded border border-neutral-500/30 p-4">
        <h2 className="font-bold">{DEMO_PUZZLE.title}</h2>
        <p className="mt-1 opacity-80">{DEMO_PUZZLE.flavor}</p>
        <p className="mt-2">{DEMO_PUZZLE.brief}</p>
      </section>

      <p className="mb-4 opacity-60">
        {character
          ? `${character.name} — token budget ${getTokenBudget(character.stats.int)} (INT ${character.stats.int})`
          : "No character found — casting with neutral defaults. Create one at /character/create."}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          className="min-h-32 rounded border border-neutral-500/30 bg-transparent p-3"
          placeholder="Write the prompt your familiar will cast..."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="rounded border border-neutral-500/30 px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Casting..." : "Cast"}
        </button>
      </form>

      {error && <p className="mt-4 text-red-500">{error}</p>}

      {result && (
        <section className="mt-6 flex flex-col gap-3">
          <div className="rounded border border-neutral-500/30 p-4">
            <h3 className="font-bold">Familiar output</h3>
            <pre className="mt-2 whitespace-pre-wrap">
              {result.familiarOutput}
            </pre>
          </div>

          <div className="rounded border border-neutral-500/30 p-4">
            <h3 className="font-bold">Judge</h3>
            <p className="mt-2">score: {result.judge.score}</p>
            <p>elegance: {result.judge.elegance}</p>
            <p>feedback: {result.judge.feedback}</p>
          </div>

          <div className="rounded border border-neutral-500/30 p-4">
            <h3 className="font-bold">Resolution</h3>
            <p className="mt-2 uppercase">
              {result.resolution.outcome}
              {result.resolution.isCrit ? " — CRIT!" : ""}
            </p>
            <p>damage: {result.resolution.damage}</p>
          </div>
        </section>
      )}
    </main>
  );
}
