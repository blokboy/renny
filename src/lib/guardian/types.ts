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
  kind: "dependency-lock";
  family: GuardianDependencyFamily;
  puzzle: GuardianPuzzle;
  firstCaster: GuardianAlly;
  npcTask: string;
  npcOutput: string;
  handoffInstruction: string;
  playerShard: string;
}

export interface InterrogationConvergence {
  kind: "interrogation";
  family: "Interrogation";
  puzzle: GuardianPuzzle;
  hiddenAnswer: string;
  facts: string[];
}

export type GuardianShield = DependencyLock | InterrogationConvergence;

export interface GuardianEncounter {
  id: string;
  generatedAt: string;
  playerClassId: ClassId;
  soloPuzzle: GuardianPuzzle;
  allies: GuardianAlly[];
  shield: GuardianShield;
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
  mode?: "standard" | "interrogation-final";
}

export interface GuardianCastResponse {
  familiarOutput: string;
  judge: { score: number; elegance: number; feedback: string };
  resolution: { outcome: "hit" | "miss" | "fail"; damage: number; isCrit: boolean };
  manaCost: number;
  xpGained: number;
}

export const GUARDIAN_DEPENDENCY_FAMILIES = [
  "Multi-hop state tracking",
  "Ambiguity resolution",
  "Reverse-prompt",
] as const satisfies readonly PuzzleFamily[];

export type GuardianDependencyFamily = (typeof GUARDIAN_DEPENDENCY_FAMILIES)[number];

export const GUARDIAN_SHIELD_FAMILIES = [
  ...GUARDIAN_DEPENDENCY_FAMILIES,
  "Interrogation",
] as const satisfies readonly PuzzleFamily[];

export type GuardianShieldFamily = (typeof GUARDIAN_SHIELD_FAMILIES)[number];

export type InterrogationAnswer = "yes" | "no";

export interface InterrogationExchange {
  speakerIndex: number;
  question: string;
  answer: InterrogationAnswer;
}

export interface InterrogationState {
  exchanges: InterrogationExchange[];
  finalSubmitted: boolean;
}
