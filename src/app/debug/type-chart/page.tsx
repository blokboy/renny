"use client";

import { useMemo, useState } from "react";
import {
  CLASSES,
  PUZZLE_FAMILIES,
  getEffectiveCost,
  getCritChance,
  type ClassName,
} from "@/lib/combat/typeChart";

/** Sentinel value for exercising the closed-enum validation path in the UI. */
const INVALID_TAG = "__hallucinated-family__";
const NONE = "__none__";

export default function DebugTypeChartPage() {
  const [className, setClassName] = useState<ClassName>("Wizard");
  const [primaryFamily, setPrimaryFamily] = useState<string>(
    PUZZLE_FAMILIES[0]
  );
  const [secondaryFamily, setSecondaryFamily] = useState<string>(NONE);
  const [isStabEligible, setIsStabEligible] = useState(false);
  const [isEmptyFist, setIsEmptyFist] = useState(false);
  const [baseCost, setBaseCost] = useState(10);

  const isMonk = className === "Monk";

  const primaryTag = primaryFamily === INVALID_TAG ? "Hallucinated Family" : primaryFamily;
  const secondaryTag =
    secondaryFamily === NONE
      ? null
      : secondaryFamily === INVALID_TAG
        ? "Another Made-Up Family"
        : secondaryFamily;

  const result = useMemo(() => {
    if (isMonk) {
      return getCritChance(primaryTag, secondaryTag, {
        isStabEligible,
        isEmptyFist,
      });
    }
    return getEffectiveCost(className, primaryTag, secondaryTag, {
      isStabEligible,
      baseCost,
    });
  }, [
    isMonk,
    className,
    primaryTag,
    secondaryTag,
    isStabEligible,
    isEmptyFist,
    baseCost,
  ]);

  return (
    <main className="mx-auto max-w-2xl flex-1 p-8 font-mono text-sm">
      <h1 className="mb-4 text-lg font-bold">Type-Chart Debug</h1>
      <p className="mb-6 opacity-80">
        Pure lookup: class + puzzle family tag(s) → effective mana-cost
        divisor (or Monk crit chance). See{" "}
        <code>src/lib/combat/typeChart.ts</code>.
      </p>

      <form className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          Class
          <select
            className="rounded border border-neutral-500/30 bg-transparent p-2"
            value={className}
            onChange={(event) => setClassName(event.target.value as ClassName)}
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          Primary family
          <select
            className="rounded border border-neutral-500/30 bg-transparent p-2"
            value={primaryFamily}
            onChange={(event) => setPrimaryFamily(event.target.value)}
          >
            {PUZZLE_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
            <option value={INVALID_TAG}>
              ⚠ invalid tag (test snap-to-default)
            </option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          Secondary family (dual-typed boss)
          <select
            className="rounded border border-neutral-500/30 bg-transparent p-2"
            value={secondaryFamily}
            onChange={(event) => setSecondaryFamily(event.target.value)}
          >
            <option value={NONE}>None (single-typed)</option>
            {PUZZLE_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
            <option value={INVALID_TAG}>
              ⚠ invalid tag (test snap-to-default)
            </option>
          </select>
        </label>

        {!isMonk && (
          <label className="flex flex-col gap-1">
            Base cost
            <input
              type="number"
              className="rounded border border-neutral-500/30 bg-transparent p-2"
              value={baseCost}
              onChange={(event) => setBaseCost(Number(event.target.value))}
            />
          </label>
        )}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isStabEligible}
            onChange={(event) => setIsStabEligible(event.target.checked)}
          />
          STAB (class&apos;s own signature spell cast into this family)
        </label>

        {isMonk && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isEmptyFist}
              onChange={(event) => setIsEmptyFist(event.target.checked)}
            />
            Empty Fist (capstone: ×3 crit multiplier instead of ×2)
          </label>
        )}
      </form>

      <section className="mt-6 flex flex-col gap-3">
        <div className="rounded border border-neutral-500/30 p-4">
          <h2 className="font-bold">Normalized input</h2>
          <p className="mt-2">
            primary family: {result.primaryFamily}
            {result.primaryFamilyWasInvalid && (
              <span className="text-amber-500">
                {" "}
                (invalid tag snapped to default)
              </span>
            )}
          </p>
          <p>
            secondary family: {result.secondaryFamily ?? "(none)"}
            {result.secondaryFamilyWasInvalid && (
              <span className="text-amber-500">
                {" "}
                (invalid tag snapped to default)
              </span>
            )}
          </p>
        </div>

        {isMonk && "critChance" in result && (
          <div className="rounded border border-neutral-500/30 p-4">
            <h2 className="font-bold">Monk result</h2>
            <p className="mt-2">crit chance: {result.critChance}%</p>
            <p>crit multiplier: ×{result.critMultiplier}</p>
            <p>STAB applied: {String(result.stabApplied)}</p>
          </div>
        )}

        {"divisor" in result && (
          <div className="rounded border border-neutral-500/30 p-4">
            <h2 className="font-bold">Non-Monk result</h2>
            <p className="mt-2">divisor: ÷{result.divisor}</p>
            <p>base cost: {result.baseCost}</p>
            <p>effective cost: {result.effectiveCost.toFixed(3)}</p>
            <p>STAB applied: {String(result.stabApplied)}</p>
          </div>
        )}

        {"reason" in result && (
          <div className="rounded border border-red-500/40 p-4">
            <h2 className="font-bold text-red-500">Rejected</h2>
            <p className="mt-2">reason: {result.reason}</p>
            <p>{result.detail}</p>
          </div>
        )}
      </section>
    </main>
  );
}
