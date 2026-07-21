import type { CharacterStats, ClassId } from "./types";

/**
 * PROVISIONAL PLACEHOLDER — pending issue #5 (Stats & Mana Economy).
 *
 * Issue #5, which owns the real stat/point-buy system and mana pool sizing,
 * is not implemented yet, and Character Creation (#3) is one of its two
 * blockers. Rather than block on #5 or invent a full mechanical system here,
 * these are hand-picked starting values (on a rough 1-20 scale) chosen only
 * to thematically differentiate the 7 classes on the character-creation stat
 * bars, per the same precedent issue #4 set for its own undocumented
 * hit/miss/fail thresholds: isolate the guess in one clearly-documented file
 * rather than scattering it or guessing silently.
 *
 * Do not depend on these numbers being final — #5 will very likely replace
 * this whole file with a real point-buy/stat-growth system.
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
 * PROVISIONAL PLACEHOLDER — pending issue #5. Simple formulas that turn a
 * class's placeholder STR/WIS into a starting HP/mana pool, chosen only so
 * the numbers move in a class-appropriate direction (e.g. Knight tanky,
 * Wizard squishy-but-mana-hungry... except also mana-starved, per its own
 * flavor). Real numbers belong entirely to #5.
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
