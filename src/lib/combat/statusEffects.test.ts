import { describe, expect, it } from "vitest";
import {
  applyConfusion,
  applyManaBurn,
  applyPoison,
  applySilence,
  applySleep,
  cleanseStatusEffect,
  degradeTextWithPoison,
  garblePrompt,
  getActivePoison,
  isAsleep,
  isCategoryBlocked,
  isConfused,
  MANA_BURN_DRAIN_FRACTION,
  POISON_MAX_DURATION_TURNS,
  POISON_MIN_DURATION_TURNS,
  tickStatusEffects,
} from "./statusEffects";

describe("1-turn effects (Sleep, Silence, Confusion)", () => {
  it("applySleep sets a 1-turn duration and isAsleep sees it", () => {
    const effect = applySleep();
    expect(effect.turnsRemaining).toBe(1);
    expect(isAsleep([effect])).toBe(true);
  });

  it("expires after one tick", () => {
    const afterTick = tickStatusEffects([applySleep()]);
    expect(afterTick).toHaveLength(0);
    expect(isAsleep(afterTick)).toBe(false);
  });

  it("applySilence defaults to blocking 'ward' and isCategoryBlocked matches it", () => {
    const effect = applySilence();
    expect(effect.turnsRemaining).toBe(1);
    expect(isCategoryBlocked([effect], "ward")).toBe(true);
    expect(isCategoryBlocked([effect], "attack")).toBe(false);
  });

  it("applySilence accepts a custom blocked category", () => {
    const effect = applySilence("attack");
    expect(isCategoryBlocked([effect], "attack")).toBe(true);
    expect(isCategoryBlocked([effect], "ward")).toBe(false);
  });

  it("applyConfusion sets a 1-turn duration and isConfused sees it", () => {
    const effect = applyConfusion();
    expect(effect.turnsRemaining).toBe(1);
    expect(isConfused([effect])).toBe(true);
  });
});

describe("Mana Burn — instant, one-time drain (not a duration effect)", () => {
  it("drains a fraction of max mana, not current mana", () => {
    const result = applyManaBurn(100, 200);
    expect(result).toBe(100 - Math.round(200 * MANA_BURN_DRAIN_FRACTION));
  });

  it("floors at 0, never goes negative", () => {
    expect(applyManaBurn(1, 200)).toBe(0);
  });
});

describe("Poison — 2-3 turn duration, compounding severity", () => {
  it("picks a fixed 2 or 3 turn duration via rng, never scaled", () => {
    const short = applyPoison(() => 0);
    const long = applyPoison(() => 0.99);
    expect(short.turnsRemaining).toBe(POISON_MIN_DURATION_TURNS);
    expect(long.turnsRemaining).toBe(POISON_MAX_DURATION_TURNS);
  });

  it("starts at baseline severity 1", () => {
    expect(applyPoison().severity).toBe(1);
  });

  it("compounds severity by 10% per turn it isn't cleansed", () => {
    let effects = [applyPoison(() => 0.99)]; // 3-turn poison
    expect(getActivePoison(effects)?.severity).toBeCloseTo(1);

    effects = tickStatusEffects(effects);
    expect(getActivePoison(effects)?.severity).toBeCloseTo(1.1);
    expect(effects[0].turnsRemaining).toBe(2);

    effects = tickStatusEffects(effects);
    expect(getActivePoison(effects)?.severity).toBeCloseTo(1.21);
    expect(effects[0].turnsRemaining).toBe(1);

    effects = tickStatusEffects(effects);
    expect(effects).toHaveLength(0);
  });

  it("resets/clears entirely on cleanse", () => {
    const effects = tickStatusEffects([applyPoison(() => 0.99)]); // severity now 1.1
    const cleansed = cleanseStatusEffect(effects, "poison");
    expect(cleansed).toHaveLength(0);

    // A fresh application after cleansing starts back at baseline, not where it left off.
    const reapplied = applyPoison(() => 0.99);
    expect(reapplied.severity).toBe(1);
  });

  it("cleanse only removes the targeted type, leaving others intact", () => {
    const effects = [applySleep(), applyPoison(() => 0)];
    const cleansed = cleanseStatusEffect(effects, "poison");
    expect(cleansed).toHaveLength(1);
    expect(cleansed[0].type).toBe("sleep");
  });
});

describe("garblePrompt (Confusion)", () => {
  it("preserves the same set of words, just reordered", () => {
    const prompt = "solve the cipher door puzzle now";
    const garbled = garblePrompt(prompt, () => 0.5);
    expect(garbled.split(" ").sort()).toEqual(prompt.split(" ").sort());
  });

  it("is deterministic for a fixed rng", () => {
    const prompt = "alpha beta gamma delta";
    const a = garblePrompt(prompt, () => 0.5);
    const b = garblePrompt(prompt, () => 0.5);
    expect(a).toBe(b);
  });
});

describe("degradeTextWithPoison", () => {
  it("does nothing at baseline severity (1) — only lingering turns degrade", () => {
    expect(degradeTextWithPoison("the answer is forty two", 1, () => 0)).toBe(
      "the answer is forty two",
    );
  });

  it("corrupts words once severity has compounded past baseline", () => {
    const text = "the answer is forty two";
    const degraded = degradeTextWithPoison(text, 1.21, () => 0); // rng() always < fraction -> corrupt every word
    expect(degraded).not.toBe(text);
    expect(degraded.split(" ")).toHaveLength(text.split(" ").length);
  });

  it("never corrupts when rng always rolls above the fraction", () => {
    const text = "the answer is forty two";
    expect(degradeTextWithPoison(text, 1.21, () => 0.999)).toBe(text);
  });
});
