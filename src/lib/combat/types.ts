export interface Puzzle {
  id: string;
  title: string;
  flavor: string;
  /** Shown to the player; describes what a winning cast must accomplish. */
  brief: string;
  /** Judge-only: how to score the familiar's output. Never sent to the familiar. */
  rubric: string;
  /**
   * Puzzle-Master's expected token budget for a winning cast (issue #9's
   * Economy bonus divides actual tokens used by this). No Puzzle-Master
   * generator exists yet (out of scope), so this is authored by hand per
   * puzzle — see `DEMO_PUZZLE` in `puzzles.ts`.
   */
  expectedTokens: number;
}

export interface JudgeResult {
  score: number;
  /**
   * Continuous 0-1 elegance score (superseding the earlier `elegant`
   * boolean — issue #9's Elegance bonus needs a continuous value, and the
   * spec's §4/§2 rubric field is a general "generality/novelty" axis, not a
   * yes/no flag).
   */
  elegance: number;
  feedback: string;
}

export type Outcome = "hit" | "miss" | "fail";

export interface ResolvedCast {
  outcome: Outcome;
  damage: number;
}

export interface CastResult {
  familiarOutput: string;
  judge: JudgeResult;
  resolution: ResolvedCast;
}
