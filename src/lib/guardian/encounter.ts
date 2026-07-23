import { CLASSES, type ClassId } from "@/lib/character";
import type { Outcome } from "@/lib/combat/types";
import type { PuzzleFamily } from "@/lib/combat/typeChart";
import {
  GUARDIAN_SHIELD_FAMILIES,
  type GuardianAlly,
  type GuardianBattleState,
  type GuardianPhase,
  type InterrogationAnswer,
  type InterrogationState,
  type GuardianDependencyFamily,
  type GuardianShieldFamily,
} from "./types";

export const GUARDIAN_MAX_HP = 240;
export const GUARDIAN_SHIELD_THRESHOLD = 120;

export const DIAGNOSTIC_FAMILY_BY_CLASS: Record<ClassId, PuzzleFamily> = {
  rogue: "Format gauntlet",
  knight: "Constraint-satisfaction golf",
  wizard: "Transformation",
  bard: "Self-consistency traps",
  cleric: "Steganography-extraction",
  hunter: "Simulation-execution",
  monk: "Blind relay",
};

const ALLY_NAMES = ["Ivo", "Mara", "Senn", "Tala", "Orin", "Veya"] as const;

export function pickShieldFamily(rng: () => number = Math.random): GuardianShieldFamily {
  const index = Math.min(
    GUARDIAN_SHIELD_FAMILIES.length - 1,
    Math.floor(rng() * GUARDIAN_SHIELD_FAMILIES.length),
  );
  return GUARDIAN_SHIELD_FAMILIES[index];
}

export function assignNpcAllies(
  playerClassId: ClassId,
  rng: () => number = Math.random,
): GuardianAlly[] {
  const candidates = CLASSES.filter(({ id }) => id !== playerClassId).map(({ id, name }) => ({ id, name }));

  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
  }

  return candidates.slice(0, 3).map((candidate, index) => ({
    classId: candidate.id,
    name: `${ALLY_NAMES[index]} the ${candidate.name}`,
    castLine: `${ALLY_NAMES[index]} steadies their ${candidate.name.toLowerCase()} familiar and casts the opening shard.`,
  }));
}

/** Cosmetic-only weighting for `simulateAllyCast` — the solo phase's NPC allies aren't judged for real, so this just needs to feel like a fight is happening alongside the player's. */
const ALLY_OUTCOME_WEIGHTS: readonly { outcome: Outcome; weight: number }[] = [
  { outcome: "hit", weight: 0.55 },
  { outcome: "miss", weight: 0.25 },
  { outcome: "fail", weight: 0.2 },
];

export interface AllyCastSimulation {
  outcome: Outcome;
  damage: number;
  manaCost: number;
}

/**
 * Simulates one NPC ally's cast during the solo phase — allies don't have a
 * real judge call (only the player's prompt is scored), so this fabricates a
 * plausible outcome to drive their HP/mana bars and combat log lines. A
 * "fail" costs the ally HP (mirroring `applyGuardianCast`'s player damage
 * rule); every outcome costs mana.
 */
export function simulateAllyCast(rng: () => number = Math.random): AllyCastSimulation {
  const roll = rng();
  let cumulative = 0;
  let outcome: Outcome = ALLY_OUTCOME_WEIGHTS[ALLY_OUTCOME_WEIGHTS.length - 1].outcome;
  for (const entry of ALLY_OUTCOME_WEIGHTS) {
    cumulative += entry.weight;
    if (roll < cumulative) {
      outcome = entry.outcome;
      break;
    }
  }

  return {
    outcome,
    damage: outcome === "fail" ? 8 + Math.floor(rng() * 10) : 0,
    manaCost: 4 + Math.floor(rng() * 6),
  };
}

export function buildDependencyShard(
  family: GuardianDependencyFamily,
  npcOutput: string,
  handoffInstruction: string,
): string {
  const leadByFamily: Record<GuardianDependencyFamily, string> = {
    "Multi-hop state tracking": "Your ally's completed ledger is the only valid starting state",
    "Ambiguity resolution": "Your ally has fixed the interpretation the party must now honor",
    "Reverse-prompt": "Your ally has produced the target output your prompt must recreate",
  };

  return `${leadByFamily[family]}:\n\n${npcOutput}\n\nYour dependent shard:\n${handoffInstruction}`;
}

export const INTERROGATION_QUESTION_LIMIT = 4;

export function createInterrogationState(): InterrogationState {
  return { exchanges: [], finalSubmitted: false };
}

export function recordInterrogationAnswer(
  state: InterrogationState,
  question: string,
  answer: InterrogationAnswer,
): InterrogationState {
  if (state.finalSubmitted || state.exchanges.length >= INTERROGATION_QUESTION_LIMIT) {
    return state;
  }

  return {
    ...state,
    exchanges: [
      ...state.exchanges,
      { speakerIndex: state.exchanges.length, question: question.trim(), answer },
    ],
  };
}

export function submitInterrogationFinal(state: InterrogationState): InterrogationState {
  if (state.finalSubmitted || state.exchanges.length === 0) return state;
  return { ...state, finalSubmitted: true };
}

export function createInitialBattleState(maxHp: number, maxMana: number): GuardianBattleState {
  return {
    phase: "solo",
    bossHp: GUARDIAN_MAX_HP,
    playerHp: maxHp,
    playerMana: maxMana,
    shieldBroken: false,
    totalXpGained: 0,
    turn: 1,
  };
}

export function applyGuardianCast(
  state: GuardianBattleState,
  result: {
    outcome: Outcome;
    damage: number;
    manaCost: number;
    xpGained: number;
    terminalOnFail?: boolean;
  },
): GuardianBattleState {
  if (state.phase === "victory" || state.phase === "defeat") return state;

  const playerMana = Math.max(0, state.playerMana - result.manaCost);
  const playerHp = Math.max(
    0,
    state.playerHp - (result.outcome === "fail" ? result.damage : 0),
  );
  let bossHp = state.bossHp;
  let phase: GuardianPhase = state.phase;
  let shieldBroken = state.shieldBroken;

  if (result.outcome === "hit") {
    if (state.phase === "solo") {
      bossHp = Math.max(GUARDIAN_SHIELD_THRESHOLD, bossHp - result.damage);
      if (bossHp === GUARDIAN_SHIELD_THRESHOLD) phase = "shield";
    } else if (state.phase === "shield") {
      shieldBroken = true;
      phase = "finish";
    } else {
      bossHp = Math.max(0, bossHp - result.damage);
      if (bossHp === 0) phase = "victory";
    }
  }

  if (playerHp === 0 || (playerMana === 0 && phase !== "victory")) {
    phase = "defeat";
  }
  if (result.outcome === "fail" && result.terminalOnFail) phase = "defeat";

  return {
    ...state,
    phase,
    bossHp,
    playerHp,
    playerMana,
    shieldBroken,
    totalXpGained: state.totalXpGained + result.xpGained,
    turn: state.turn + 1,
  };
}
