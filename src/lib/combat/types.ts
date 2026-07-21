export interface Puzzle {
  id: string;
  title: string;
  flavor: string;
  /** Shown to the player; describes what a winning cast must accomplish. */
  brief: string;
  /** Judge-only: how to score the familiar's output. Never sent to the familiar. */
  rubric: string;
}

export interface JudgeResult {
  score: number;
  elegant: boolean;
  feedback: string;
}

export type Outcome = "hit" | "miss" | "fail";

export interface ResolvedCast {
  outcome: Outcome;
  damage: number;
  /** LCK-driven crit (issue #5) — a near-perfect score rolled a crit multiplier. */
  isCrit: boolean;
}

export interface CastResult {
  familiarOutput: string;
  judge: JudgeResult;
  resolution: ResolvedCast;
}
