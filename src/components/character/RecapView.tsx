"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CharacterSprite } from "@/components/assets/CharacterSprite";
import { getClassDefinition, getCharacter, clearCharacter } from "@/lib/character";
import type { CharacterRecord } from "@/lib/character";
import { StatBar } from "./StatBar";

/**
 * The recap/confirmation screen at the end of Character Creation. Reads the
 * just-saved `CharacterRecord` back via `getCharacter()` (proving the
 * persistence layer, not just in-wizard state, produced the record) and
 * ties it back to the Convocation's "informed choice" framing with
 * placeholder copy — the Convocation itself (#10) isn't built yet.
 *
 * `getCharacter()` is read once via a lazy `useState` initializer rather
 * than an effect: this is the initial client render (not a later update),
 * so the initializer already runs with real `window`/`localStorage` access
 * and the redirect-on-missing effect below never sees a stale null. A
 * `useSyncExternalStore`-based version was tried and reverted — its
 * server/client snapshot swap only completes *after* passive effects run,
 * which raced this component's own redirect effect and caused false
 * redirects on a hard reload (caught by clicking through the actual flow,
 * not just typecheck/build). The trade-off here is a harmless, expected
 * one-time hydration console warning (server has no `localStorage` to
 * match the client's real first paint) on this browser-only,
 * inherently-non-SSR-meaningful page.
 */
export function RecapView() {
  const router = useRouter();
  const [record] = useState<CharacterRecord | null>(() => getCharacter());

  useEffect(() => {
    if (record === null) {
      router.replace("/character/create");
    }
  }, [record, router]);

  if (record === null) {
    return <p className="text-zinc-400">No hero found — redirecting…</p>;
  }

  const classDef = getClassDefinition(record.classId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-8 sm:flex-row sm:items-start">
        <CharacterSprite config={record.sprite} size={140} />
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-white">{record.name}</h2>
          <p className="text-emerald-400">
            {classDef.name} — {classDef.tagline}
          </p>
          <p className="text-sm text-zinc-400">{classDef.familiar}</p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
          Current stats
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <StatBar label="STR" value={record.stats.str} />
          <StatBar label="INT" value={record.stats.int} />
          <StatBar label="WIS" value={record.stats.wis} />
          <StatBar label="SPD" value={record.stats.spd} />
          <StatBar label="LCK" value={record.stats.lck} />
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          HP <span className="text-white">{record.startingHp}</span> · Mana{" "}
          <span className="text-white">{record.startingMana}</span>
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm leading-relaxed text-zinc-300">
          <span className="font-medium text-white">An informed choice.</span> You&rsquo;ve felt
          which puzzles sang to you, and which mind rose to meet them — and now {record.name}{" "}
          carries that lesson forward, bound to the {classDef.name.toLowerCase()}
          &rsquo;s {classDef.familiar.split(" — ")[0].replace(/^Bound to /i, "")}.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          The shrine&rsquo;s last gate is waiting. Your class&rsquo;s diagnostic family will shape the
          opening exchange.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            clearCharacter();
            router.push("/character/create");
          }}
          className="rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500"
        >
          Start over
        </button>
        <button
          type="button"
          onClick={() => router.push("/guardian")}
          className="rounded bg-emerald-400 px-5 py-2 text-sm font-bold text-zinc-950 transition hover:bg-emerald-300"
        >
          Face the Threshold Guardian
        </button>
      </div>
    </div>
  );
}
