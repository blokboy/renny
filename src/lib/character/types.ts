/**
 * Core types for Renny's Character Creation flow (issue #3) and Stats &
 * Mana Economy (issue #5).
 *
 * See docs/adr/0002-character-creation.md for Character Creation's contract
 * and docs/adr/0003-stats-mana-economy.md for how the 5 stats and mana cost
 * model are actually mechanized.
 */
import type { CharacterSpriteConfig } from "@/lib/assets";

/** The 7 playable classes. Stable ids — used as storage/lookup keys. */
export type ClassId =
  | "rogue"
  | "knight"
  | "wizard"
  | "bard"
  | "cleric"
  | "hunter"
  | "monk";

/**
 * The 5 core stats (`prompt-quest-full-spec.md` §5.3 — the design doc's
 * original 4-stat display is superseded by this 5-stat version).
 */
export interface CharacterStats {
  /** Flat multiplier on damage dealt. */
  str: number;
  /** Max token budget for a single prompt/cast. */
  int: number;
  /** Max mana pool across a fight. */
  wis: number;
  /** Turn order within a round — who casts first. */
  spd: number;
  /** Crit chance. */
  lck: number;
}

/** How a named spell's mana cost is derived from the baseline cost. */
export type SpellCostModel =
  | { kind: "free" }
  | { kind: "baseline"; multiplier: number };

/** One entry in a class's Lv1/25/50/75/100 skill tree. */
export interface SpellDef {
  level: 1 | 25 | 50 | 75 | 100;
  name: string;
  description: string;
  cost: SpellCostModel;
}

/** A class's unique Ward spell (counters prompt injection — mechanics land with issue #7). */
export interface WardDef {
  name: string;
  description: string;
  cost: SpellCostModel;
}

/** Static, designer-authored data describing one of the 7 classes. */
export interface ClassDefinition {
  id: ClassId;
  name: string;
  tagline: string;
  /** Which model lineage this class's familiar draws from, in-fiction. */
  familiar: string;
  spells: SpellDef[];
  ward: WardDef;
}

/**
 * The result of the name+appearance portion of Character Creation. Class
 * selection is deferred to just before the Threshold Guardian (see the
 * Convocation/Threshold Guardian issues) rather than happening up front, so
 * a draft is all Character Creation itself produces.
 */
export interface CharacterDraft {
  name: string;
  sprite: CharacterSpriteConfig;
  createdAt: string;
}

/**
 * The persisted result of class selection: a `CharacterDraft` plus
 * everything needed to hand a freshly-classed hero off to the rest of the
 * game. `startingHp`/`startingMana` are the character's full pools at
 * creation time (the character starts at full health/mana, so no separate
 * "current" value is needed yet).
 */
export interface CharacterRecord extends CharacterDraft {
  classId: ClassId;
  stats: CharacterStats;
  startingHp: number;
  startingMana: number;
  /** Starts at 1/0 on creation. See `@/lib/xp` (issue #9) for the XP curve and level-up logic. */
  level: number;
  xp: number;
}
