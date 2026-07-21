"use client";

import { useMemo, useState } from "react";
import { XP_to_next, getCumulativeXpToLevel } from "@/lib/xp/curve";
import { getEconomyBonus, getEleganceBonus, getXpForCast } from "@/lib/xp/bonuses";
import { estimateTokens } from "@/lib/xp/tokens";
import { runCalibration } from "@/lib/xp/calibration";

export default function DebugXpPage() {
  const [level, setLevel] = useState(1);
  const [baseXp, setBaseXp] = useState(371);
  const [expectedTokens, setExpectedTokens] = useState(40);
  const [promptText, setPromptText] = useState("");
  const [eleganceScore, setEleganceScore] = useState(0.5);

  const actualTokens = useMemo(() => estimateTokens(promptText), [promptText]);
  const economyBonus = getEconomyBonus(actualTokens, expectedTokens);
  const eleganceBonus = getEleganceBonus(eleganceScore);
  const xpGained = getXpForCast(baseXp, actualTokens, expectedTokens, eleganceScore);

  const calibration = useMemo(() => runCalibration(), []);

  return (
    <main className="mx-auto max-w-2xl flex-1 p-8 font-mono text-sm">
      <h1 className="mb-4 text-lg font-bold">XP &amp; Leveling Debug</h1>
      <p className="mb-6 opacity-80">
        XP curve, Economy/Elegance bonuses, and the onboarding calibration
        check. See <code>src/lib/xp/</code>.
      </p>

      <section className="mb-6 rounded border border-neutral-500/30 p-4">
        <h2 className="font-bold">XP curve</h2>
        <label className="mt-2 flex flex-col gap-1">
          Level
          <input
            type="number"
            min={1}
            className="rounded border border-neutral-500/30 bg-transparent p-2"
            value={level}
            onChange={(event) => setLevel(Number(event.target.value))}
          />
        </label>
        <p className="mt-2">XP to next level: {XP_to_next(level)}</p>
        <p>Cumulative XP to reach Level {level}: {getCumulativeXpToLevel(level)}</p>
      </section>

      <section className="mb-6 rounded border border-neutral-500/30 p-4">
        <h2 className="font-bold">Per-cast XP grant</h2>
        <form className="mt-2 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            Base XP
            <input
              type="number"
              className="rounded border border-neutral-500/30 bg-transparent p-2"
              value={baseXp}
              onChange={(event) => setBaseXp(Number(event.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1">
            Expected tokens (Puzzle-Master estimate)
            <input
              type="number"
              className="rounded border border-neutral-500/30 bg-transparent p-2"
              value={expectedTokens}
              onChange={(event) => setExpectedTokens(Number(event.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1">
            Player&apos;s prompt (drives actual tokens)
            <textarea
              className="min-h-20 rounded border border-neutral-500/30 bg-transparent p-2"
              value={promptText}
              onChange={(event) => setPromptText(event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            Elegance score (0-1, from the Judge)
            <input
              type="number"
              min={0}
              max={1}
              step={0.1}
              className="rounded border border-neutral-500/30 bg-transparent p-2"
              value={eleganceScore}
              onChange={(event) => setEleganceScore(Number(event.target.value))}
            />
          </label>
        </form>

        <div className="mt-4 border-t border-neutral-500/30 pt-4">
          <p>actual tokens (estimated): {actualTokens}</p>
          <p>economy bonus: +{(economyBonus * 100).toFixed(1)}%</p>
          <p>elegance bonus: +{(eleganceBonus * 100).toFixed(1)}%</p>
          <p className="font-bold">xp gained: {xpGained}</p>
        </div>
      </section>

      <section className="rounded border border-neutral-500/30 p-4">
        <h2 className="font-bold">Onboarding calibration check</h2>
        <p className="mt-2 opacity-80">
          Simulated {calibration.steps.length}-cast onboarding funnel against
          a Level 1→{calibration.targetLevel} target of {calibration.targetXp}{" "}
          XP.
        </p>
        <p className="mt-2">
          Final: Level {calibration.finalLevel}, {calibration.finalXp} XP (
          {calibration.totalXpGained} XP granted total) —{" "}
          <span className={calibration.hitsTarget ? "text-green-500" : "text-amber-500"}>
            {calibration.hitsTarget ? "hits target" : "misses target"}
          </span>
        </p>

        <table className="mt-4 w-full text-left">
          <thead>
            <tr className="opacity-60">
              <th className="pr-4">#</th>
              <th className="pr-4">econ</th>
              <th className="pr-4">eleg</th>
              <th className="pr-4">xp+</th>
              <th className="pr-4">level</th>
              <th>xp</th>
            </tr>
          </thead>
          <tbody>
            {calibration.steps.map((step) => (
              <tr key={step.index}>
                <td className="pr-4">{step.index}</td>
                <td className="pr-4">{(step.economyBonus * 100).toFixed(0)}%</td>
                <td className="pr-4">{(step.eleganceBonus * 100).toFixed(0)}%</td>
                <td className="pr-4">{step.xpGained}</td>
                <td className="pr-4">{step.level}</td>
                <td>{step.xp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
