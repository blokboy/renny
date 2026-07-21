import type { CastResult } from "@/lib/combat/types";

export interface ConvocationCastResponse extends CastResult {
  stopId: number;
  xp: {
    baseXp: number;
    gained: number;
    actualTokens: number;
    expectedTokens: number;
    economyBonus: number;
    eleganceBonus: number;
  };
}
