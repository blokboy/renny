import type { CharacterStats, ClassId } from "./types";

/**
 * Per-class Level-1 stats (`prompt-quest-full-spec.md` §5.3), on a rough
 * 1-20 scale. These values shipped as issue #3's placeholder (chosen only to
 * thematically differentiate the 7 classes on the creation screen's stat
 * bars) and are kept as-is here — issue #5 owns finalizing them, and no
 * rebalance is called for; what #5 adds is the growth curve below, plus the
 * mechanics each stat now actually drives. See docs/adr/0003-stats-mana-economy.md.
 */
export const STARTING_STATS: Record<ClassId, CharacterStats> = {
  // Speed is a stat — highest SPD in the roster, LCK to match its crit/probe kit.
  rogue: { str: 8, int: 8, wis: 8, spd: 18, lck: 14 },
  // The reliable spine — high STR (a real damage stat) and high WIS (sustains
  // the party through a long fight), at the cost of SPD/LCK.
  knight: { str: 16, int: 10, wis: 16, spd: 8, lck: 6 },
  // Thinking budget is spell slots — highest INT (token budget) in the roster,
  // but deliberately "mana-starved" (low WIS) per its design-doc identity.
  wizard: { str: 6, int: 18, wis: 8, spd: 6, lck: 8 },
  // Ensemble/self-consistency identity leans on LCK (crit/variance flavor),
  // otherwise a generalist.
  bard: { str: 8, int: 10, wis: 10, spd: 10, lck: 16 },
  // Scaling scripture/context — highest WIS (sustained casting) alongside a
  // strong INT (large context budget) to match its retrieval identity.
  cleric: { str: 8, int: 14, wis: 16, spd: 8, lck: 8 },
  // Scaling tool slots — an even generalist spread with a slight INT/SPD lean
  // for tool-assisted prompting.
  hunter: { str: 10, int: 14, wis: 10, spd: 12, lck: 10 },
  // No API cost, ever — deliberately low INT (word-cap discipline is the
  // class's whole identity) and low WIS (barely needs a mana pool since its
  // casts are free), compensated by high SPD/LCK.
  monk: { str: 10, int: 6, wis: 6, spd: 14, lck: 16 },
};

/**
 * Per-level stat growth (issue #5). Not specified numerically by the design
 * docs (§9 calls exact numeric tuning an open item) — this mirrors each
 * class's `STARTING_STATS` emphasis (its highest starting stats grow
 * fastest) rather than inventing an unrelated curve, isolated here per the
 * same documented-placeholder precedent ADR 0002/0001 established. See
 * docs/adr/0003-stats-mana-economy.md for the full rationale.
 */
export const STAT_GROWTH_PER_LEVEL: Record<ClassId, CharacterStats> = {
  rogue: { str: 0.2, int: 0.2, wis: 0.2, spd: 0.6, lck: 0.5 },
  knight: { str: 0.5, int: 0.3, wis: 0.5, spd: 0.2, lck: 0.15 },
  wizard: { str: 0.15, int: 0.6, wis: 0.2, spd: 0.15, lck: 0.2 },
  bard: { str: 0.25, int: 0.3, wis: 0.3, spd: 0.3, lck: 0.5 },
  cleric: { str: 0.2, int: 0.45, wis: 0.55, spd: 0.2, lck: 0.2 },
  hunter: { str: 0.3, int: 0.4, wis: 0.3, spd: 0.35, lck: 0.25 },
  monk: { str: 0.25, int: 0.15, wis: 0.15, spd: 0.45, lck: 0.5 },
};

/**
 * Pure function of (class, level) rather than an incremental mutator —
 * deliberately so. `STAT_GROWTH_PER_LEVEL` is fractional, and rounding a
 * fractional increment on every single level-up (e.g. 0.2/level, called
 * once per level as XP/leveling (#9) advances level-by-level) would lose
 * or double-count fractions depending on call cadence. Recomputing from
 * `STARTING_STATS` and rounding once avoids that drift entirely, and lets
 * issue #9's leveling engine just call `getStatsAtLevel(classId, newLevel)`
 * and re-save the result — no separate accumulator to keep in sync.
 */
export function getStatsAtLevel(classId: ClassId, level: number): CharacterStats {
  const base = STARTING_STATS[classId];
  const growth = STAT_GROWTH_PER_LEVEL[classId];
  const levelsGained = Math.max(0, level - 1);

  return {
    str: base.str + Math.round(growth.str * levelsGained),
    int: base.int + Math.round(growth.int * levelsGained),
    wis: base.wis + Math.round(growth.wis * levelsGained),
    spd: base.spd + Math.round(growth.spd * levelsGained),
    lck: base.lck + Math.round(growth.lck * levelsGained),
  };
}

/**
 * HP/mana pool formulas off STR/WIS respectively (`prompt-quest-full-spec.md`
 * §5.3: WIS governs max mana; STR is the damage stat, HP scaling off it is
 * this file's own thematic choice, same as issue #3 originally picked).
 * Takes any `CharacterStats` — not just Level-1 starting stats — so these
 * same formulas serve a leveled-up character's pools via
 * `getStatsAtLevel`, without a second set of functions.
 */
const BASE_HP = 40;
const HP_PER_STR = 3;
const BASE_MANA = 20;
const MANA_PER_WIS = 5;

export function getStartingHp(stats: CharacterStats): number {
  return BASE_HP + stats.str * HP_PER_STR;
}

export function getStartingMana(stats: CharacterStats): number {
  return BASE_MANA + stats.wis * MANA_PER_WIS;
}
