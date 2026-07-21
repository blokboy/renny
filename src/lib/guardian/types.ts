import type { Puzzle } from "@/lib/combat/types";
import type { PuzzleFamily } from "@/lib/combat/typeChart";
import type { CharacterStats, ClassId } from "@/lib/character";

export type GuardianPhase = "solo" | "shield" | "finish" | "victory" | "defeat";

export interface GuardianPuzzle extends Puzzle {
  family: PuzzleFamily;
}

export interface GuardianAlly {
  classId: ClassId;
  name: string;
  castLine: string;
}

export interface DependencyLock {
  family: GuardianShieldFamily;
  puzzle: GuardianPuzzle;
  firstCaster: GuardianAlly;
  npcTask: string;
  npcOutput: string;
  handoffInstruction: string;
  playerShard: string;
}

export interface GuardianEncounter {
  id: string;
  generatedAt: string;
  playerClassId: ClassId;
  soloPuzzle: GuardianPuzzle;
  allies: GuardianAlly[];
  dependencyLock: DependencyLock;
}

export interface GuardianBattleState {
  phase: GuardianPhase;
  bossHp: number;
  playerHp: number;
  playerMana: number;
  shieldBroken: boolean;
  totalXpGained: number;
  turn: number;
}

export interface GuardianCastRequest {
  prompt: string;
  classId: ClassId;
  stats: CharacterStats;
  maxMana: number;
  currentMana: number;
  phase: "solo" | "shield" | "finish";
  puzzle: GuardianPuzzle;
}

export interface GuardianCastResponse {
  familiarOutput: string;
  judge: { score: number; elegance: number; feedback: string };
  resolution: { outcome: "hit" | "miss" | "fail"; damage: number; isCrit: boolean };
  manaCost: number;
  xpGained: number;
}

export const GUARDIAN_SHIELD_FAMILIES = [
  "Multi-hop state tracking",
  "Ambiguity resolution",
  "Reverse-prompt",
] as const satisfies readonly PuzzleFamily[];

export type GuardianShieldFamily = (typeof GUARDIAN_SHIELD_FAMILIES)[number];
