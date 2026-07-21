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

export type SkillLevel = 1 | 25 | 50 | 75 | 100;

export type SkillId =
  | "rogue-quickstrike"
  | "rogue-quickdraw"
  | "rogue-pickpocket"
  | "rogue-twin-strike"
  | "rogue-flurry"
  | "knight-martyr"
  | "knight-defensive-stance"
  | "knight-rally"
  | "knight-taunt"
  | "knight-perfect-form"
  | "wizard-first-thought"
  | "wizard-deep-breath"
  | "wizard-shared-insight"
  | "wizard-overclock"
  | "wizard-archmages-reverie"
  | "bard-twin-chorus"
  | "bard-extra-voice"
  | "bard-chorus-of-encouragement"
  | "bard-discordant-truth"
  | "bard-legion"
  | "cleric-recite"
  | "cleric-marginalia"
  | "cleric-shared-scripture"
  | "cleric-deep-archive"
  | "cleric-revelation"
  | "hunter-calculated-strike"
  | "hunter-quick-rig"
  | "hunter-share-the-kit"
  | "hunter-overclocked-construct"
  | "hunter-grand-contraption"
  | "monk-whisper"
  | "monk-stillness"
  | "monk-shared-silence"
  | "monk-no-mind"
  | "monk-empty-fist";

export type StatusEffectType = "sleep" | "poison" | "mana-burn" | "silence" | "confusion";
export type SkillTarget = "self" | "ally" | "party" | "enemy" | "party-protective";
export type SkillTiming = "active" | "passive" | "triggered";
export type SkillTrigger =
  | "cast"
  | "first-cast"
  | "critical-cast"
  | "trap-revealed"
  | "guard-active"
  | "ward-critical-cast";

export type SkillEffect =
  | { kind: "cast-discount"; percent: number }
  | { kind: "free-first-cast" }
  | { kind: "family-tag-reveal"; scope: "party"; detail: "partial" }
  | { kind: "extra-casts"; count: number; outputTokenCap?: number }
  | { kind: "damage-absorb"; percent: number; durationTurns: number; scope: "party" }
  | { kind: "injection-resistance"; percent: number; scope: "party" }
  | { kind: "status-resistance-choice"; scope: "party"; duration: "round" }
  | { kind: "force-target"; target: "self"; durationTurns: number }
  | { kind: "shield"; damagePercent: number; injection: boolean; statuses: boolean; scope: "party"; durationTurns: number }
  | { kind: "mana-refund"; percent: number; target: "self" | "party" | "next-party-cast" }
  | { kind: "thinking-budget-discount"; scope: "next-party-cast"; size: "small" }
  | { kind: "thinking-budget-tier-boost"; tiers: number; durationCasts: number }
  | { kind: "thinking-budget-free"; scope: "party-round" }
  | { kind: "ensemble-voices"; count: number }
  | { kind: "trap-reveal" }
  | { kind: "damage-bonus"; scope: "self-next-cast" | "party-next-cast"; size: "small" }
  | { kind: "healing"; scope: "lowest-party-member" | "party"; percentHp: number }
  | { kind: "context-share"; target: "ally"; citationBuff: boolean }
  | { kind: "context-window-multiplier"; multiplier: number; durationCasts: number }
  | { kind: "full-run-context"; durationCasts: number }
  | { kind: "revive"; scope: "party" }
  | { kind: "tool-slot"; tool: "calculator" }
  | { kind: "tool-chain-discount" }
  | { kind: "tool-slot-share"; target: "ally" }
  | { kind: "construct-actions"; count: number; durationRounds: number }
  | { kind: "tool-chain-limit"; count: number }
  | { kind: "crit-bonus"; percent: number; condition: "under-word-cap" }
  | { kind: "zero-shot" }
  | { kind: "massive-crit"; condition: "zero-shot-success" }
  | { kind: "cleanse"; statuses: StatusEffectType[]; target: "self" | "ally" | "party" }
  | { kind: "cleanse-random"; target: "party" };

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
  id: SkillId;
  level: SkillLevel;
  name: string;
  description: string;
  cost: SpellCostModel;
  timing: SkillTiming;
  target: SkillTarget;
  triggers: SkillTrigger[];
  effects: SkillEffect[];
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
