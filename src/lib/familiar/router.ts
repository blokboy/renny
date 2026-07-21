/**
 * MVP: every class routes through the same emulated model. Per-class routing
 * is a config change here later, not a rewrite of cast.ts or judge.ts.
 */
const MVP_MODEL = "moonshotai/kimi-k2";

export type ClassName =
  | "rogue"
  | "knight"
  | "wizard"
  | "bard"
  | "cleric"
  | "hunter"
  | "monk";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- seam for per-class routing later
export function getFamiliarModel(className?: ClassName): string {
  return MVP_MODEL;
}

export function getJudgeModel(): string {
  return MVP_MODEL;
}
