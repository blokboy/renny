/**
 * Turn order within a round, gated by SPD (`prompt-quest-full-spec.md`
 * §5.3). No multi-actor battle loop consumes this yet — party/dungeon
 * combat is explicitly pass-2 scope (§6) — so this ships as a pure, standalone
 * utility ready for that future loop, the same way `typeChart.ts` (#6)
 * shipped its divisor/crit engine ahead of anything calling it.
 */
export interface Combatant {
  id: string;
  spd: number;
}

/**
 * Higher SPD acts first. Ties keep combatants' original relative order (a
 * stable sort) rather than a random tiebreak, so a given party lineup's turn
 * order is deterministic and reproducible.
 */
export function getTurnOrder<T extends Combatant>(combatants: readonly T[]): T[] {
  return combatants
    .map((combatant, index) => ({ combatant, index }))
    .sort((a, b) => b.combatant.spd - a.combatant.spd || a.index - b.index)
    .map(({ combatant }) => combatant);
}
