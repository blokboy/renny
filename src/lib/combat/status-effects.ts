import type { StatusEffectType } from "../character/types";

export interface ActiveStatusEffect {
  type: StatusEffectType;
  remainingTurns: number;
  /** Poison compounds by 10 percentage points each uncleansed turn. */
  severityPercent?: number;
  /** Silence blocks one category for its 1-turn duration. */
  blockedCategory?: "skill" | "ward" | "any";
}

export interface ManaBurnDrain {
  type: "mana-burn";
  manaDrained: number;
}

export const STATUS_EFFECT_DURATIONS: Record<Exclude<StatusEffectType, "mana-burn">, number> = {
  sleep: 1,
  poison: 3,
  silence: 1,
  confusion: 1,
};

export function createStatusEffect(
  type: Exclude<StatusEffectType, "mana-burn">,
  opts: { poisonTurns?: 2 | 3; blockedCategory?: ActiveStatusEffect["blockedCategory"] } = {},
): ActiveStatusEffect {
  if (type === "poison") {
    return {
      type,
      remainingTurns: opts.poisonTurns ?? STATUS_EFFECT_DURATIONS.poison,
      severityPercent: 10,
    };
  }

  return {
    type,
    remainingTurns: STATUS_EFFECT_DURATIONS[type],
    blockedCategory: type === "silence" ? opts.blockedCategory ?? "skill" : undefined,
  };
}

export function createManaBurn(maxMana: number, percent: number = 10): ManaBurnDrain {
  return { type: "mana-burn", manaDrained: Math.max(1, Math.round(maxMana * (percent / 100))) };
}

export function tickStatusEffects(statuses: ActiveStatusEffect[]): ActiveStatusEffect[] {
  return statuses
    .map((status) => ({
      ...status,
      remainingTurns: status.remainingTurns - 1,
      severityPercent:
        status.type === "poison" ? (status.severityPercent ?? 10) + 10 : status.severityPercent,
    }))
    .filter((status) => status.remainingTurns > 0);
}

export function cleanseStatuses(
  statuses: ActiveStatusEffect[],
  cleansed: StatusEffectType[] | "random",
  rng: () => number = Math.random,
): ActiveStatusEffect[] {
  if (cleansed === "random") {
    if (statuses.length === 0) return statuses;
    const index = Math.floor(rng() * statuses.length);
    return statuses.filter((_, statusIndex) => statusIndex !== index);
  }

  const cleansedSet = new Set(cleansed);
  return statuses.filter((status) => !cleansedSet.has(status.type));
}

export function getStatusCastBlockReason(
  statuses: ActiveStatusEffect[],
  category: "skill" | "ward" = "skill",
): string | null {
  if (statuses.some((status) => status.type === "sleep")) {
    return "sleep skips the caster's action";
  }

  const silence = statuses.find(
    (status) =>
      status.type === "silence" &&
      (status.blockedCategory === "any" || status.blockedCategory === category),
  );

  if (silence) {
    return `silence blocks ${category} casts`;
  }

  return null;
}

export function getPoisonPromptDegradation(statuses: ActiveStatusEffect[]): number {
  return statuses
    .filter((status) => status.type === "poison")
    .reduce((total, status) => total + (status.severityPercent ?? 10), 0);
}
