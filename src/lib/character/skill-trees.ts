import { getStatusCastBlockReason, type ActiveStatusEffect } from "../combat/status-effects";
import { getCastManaCost } from "./mana";
import { CLASSES, getClassDefinition } from "./classes";
import type {
  ClassId,
  SkillEffect,
  SkillId,
  SkillLevel,
  SkillTrigger,
  SpellDef,
  StatusEffectType,
} from "./types";

export const SKILL_UNLOCK_LEVELS: SkillLevel[] = [1, 25, 50, 75, 100];
export const SKILLS_PER_CLASS = 5;
export const TOTAL_CLASS_SKILLS = 35;

export interface CleanseAssignment {
  classId: ClassId;
  source: "skill" | "ward";
  skillId?: SkillId;
  wardName?: string;
  status: StatusEffectType | "random";
  target: "self" | "ally" | "party";
  trigger: SkillTrigger;
}

export const CLEANSE_ASSIGNMENTS: CleanseAssignment[] = [
  {
    classId: "cleric",
    source: "skill",
    skillId: "cleric-shared-scripture",
    status: "poison",
    target: "ally",
    trigger: "cast",
  },
  {
    classId: "bard",
    source: "skill",
    skillId: "bard-chorus-of-encouragement",
    status: "confusion",
    target: "party",
    trigger: "trap-revealed",
  },
  {
    classId: "wizard",
    source: "skill",
    skillId: "wizard-shared-insight",
    status: "silence",
    target: "party",
    trigger: "critical-cast",
  },
  {
    classId: "rogue",
    source: "skill",
    skillId: "rogue-quickdraw",
    status: "mana-burn",
    target: "self",
    trigger: "first-cast",
  },
  {
    classId: "hunter",
    source: "skill",
    skillId: "hunter-share-the-kit",
    status: "sleep",
    target: "ally",
    trigger: "cast",
  },
  {
    classId: "monk",
    source: "ward",
    wardName: "Empty Mind",
    status: "random",
    target: "party",
    trigger: "ward-critical-cast",
  },
];

export interface SkillEvent {
  trigger: SkillTrigger;
  isFirstCast?: boolean;
  isCritical?: boolean;
  trapRevealed?: boolean;
  guardActive?: boolean;
  wardName?: string;
}

export interface SkillCastabilityInput {
  classId: ClassId;
  level: number;
  skillId: SkillId;
  currentMana: number;
  maxMana: number;
  primaryFamilyTag: string;
  secondaryFamilyTag?: string | null;
  statuses?: ActiveStatusEffect[];
}

export type SkillCastability =
  | { ok: true; skill: SpellDef; manaCost: "Free" | number }
  | { ok: false; skill?: SpellDef; reason: string; manaCost?: "Free" | number };

export function getAllClassSkills(): SpellDef[] {
  return CLASSES.flatMap((classDef) => classDef.spells);
}

export function getClassSkillAtLevel(classId: ClassId, level: SkillLevel): SpellDef {
  const skill = getClassDefinition(classId).spells.find((spell) => spell.level === level);
  if (!skill) {
    throw new Error(`Class "${classId}" has no Lv${level} skill`);
  }
  return skill;
}

export function getSkillDefinition(skillId: SkillId): SpellDef {
  const skill = getAllClassSkills().find((spell) => spell.id === skillId);
  if (!skill) {
    throw new Error(`Unknown skill id: "${skillId}"`);
  }
  return skill;
}

export function getSkillClassId(skillId: SkillId): ClassId {
  const classDef = CLASSES.find((candidate) => candidate.spells.some((spell) => spell.id === skillId));
  if (!classDef) {
    throw new Error(`Unknown skill id: "${skillId}"`);
  }
  return classDef.id;
}

export function getUnlockedSkills(classId: ClassId, level: number): SpellDef[] {
  return getClassDefinition(classId).spells.filter((spell) => spell.level <= level);
}

export function isSkillUnlocked(classId: ClassId, skillId: SkillId, level: number): boolean {
  return getSkillClassId(skillId) === classId && getSkillDefinition(skillId).level <= level;
}

export function isKnightPartyProtectiveFromLevelOne(): boolean {
  const martyr = getClassSkillAtLevel("knight", 1);
  return martyr.target === "party-protective" && martyr.effects.some((effect) => effect.kind === "damage-absorb");
}

export function getSkillCleanseEffects(skill: SpellDef): Extract<SkillEffect, { kind: "cleanse" }>[] {
  return skill.effects.filter((effect): effect is Extract<SkillEffect, { kind: "cleanse" }> => effect.kind === "cleanse");
}

export function getCleanseAssignmentsForClass(classId: ClassId): CleanseAssignment[] {
  return CLEANSE_ASSIGNMENTS.filter((assignment) => assignment.classId === classId);
}

export function doesSkillEventTrigger(skill: SpellDef, event: SkillEvent): boolean {
  if (!skill.triggers.includes(event.trigger)) {
    return false;
  }

  if (event.trigger === "first-cast") return event.isFirstCast === true;
  if (event.trigger === "critical-cast") return event.isCritical === true;
  if (event.trigger === "trap-revealed") return event.trapRevealed === true;
  if (event.trigger === "guard-active") return event.guardActive === true;
  return true;
}

export function getTriggeredCleanseAssignments(
  classId: ClassId,
  level: number,
  event: SkillEvent,
): CleanseAssignment[] {
  return CLEANSE_ASSIGNMENTS.filter((assignment) => {
    if (assignment.classId !== classId || assignment.trigger !== event.trigger) {
      return false;
    }

    if (assignment.source === "ward") {
      return assignment.wardName === event.wardName && event.isCritical === true;
    }

    if (!assignment.skillId || !isSkillUnlocked(classId, assignment.skillId, level)) {
      return false;
    }

    return doesSkillEventTrigger(getSkillDefinition(assignment.skillId), event);
  });
}

export function getSkillManaCost(
  skill: SpellDef,
  input: Pick<SkillCastabilityInput, "classId" | "maxMana" | "primaryFamilyTag" | "secondaryFamilyTag">,
): "Free" | number {
  return getCastManaCost(
    input.maxMana,
    skill.cost,
    input.classId,
    input.primaryFamilyTag,
    input.secondaryFamilyTag,
  );
}

export function canCastSkill(input: SkillCastabilityInput): SkillCastability {
  const skill = getSkillDefinition(input.skillId);

  if (getSkillClassId(input.skillId) !== input.classId) {
    return { ok: false, skill, reason: `${skill.name} does not belong to ${input.classId}` };
  }

  if (!isSkillUnlocked(input.classId, input.skillId, input.level)) {
    return { ok: false, skill, reason: `${skill.name} unlocks at Lv${skill.level}` };
  }

  const statusBlockReason = getStatusCastBlockReason(input.statuses ?? [], "skill");
  if (statusBlockReason) {
    return { ok: false, skill, reason: statusBlockReason };
  }

  const manaCost = getSkillManaCost(skill, input);
  if (manaCost !== "Free" && input.currentMana < manaCost) {
    return { ok: false, skill, reason: `not enough mana for ${skill.name}`, manaCost };
  }

  return { ok: true, skill, manaCost };
}

export function assertSkillTreeComplete(): void {
  const allSkills = getAllClassSkills();
  const skillIds = new Set(allSkills.map((skill) => skill.id));

  if (allSkills.length !== TOTAL_CLASS_SKILLS || skillIds.size !== TOTAL_CLASS_SKILLS) {
    throw new Error(`Expected ${TOTAL_CLASS_SKILLS} unique class skills, found ${allSkills.length}/${skillIds.size}`);
  }

  for (const classDef of CLASSES) {
    const levels = classDef.spells.map((spell) => spell.level).sort((a, b) => a - b);
    if (classDef.spells.length !== SKILLS_PER_CLASS || levels.join(",") !== SKILL_UNLOCK_LEVELS.join(",")) {
      throw new Error(`${classDef.name} must define Lv${SKILL_UNLOCK_LEVELS.join("/")} skills`);
    }
  }
}
