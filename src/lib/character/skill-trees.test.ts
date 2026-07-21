import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { createStatusEffect } from "../combat/status-effects";
import { resolveSpellCost } from "./mana";
import {
  assertSkillTreeComplete,
  canCastSkill,
  CLEANSE_ASSIGNMENTS,
  getAllClassSkills,
  getClassSkillAtLevel,
  getSkillDefinition,
  isKnightPartyProtectiveFromLevelOne,
  SKILL_UNLOCK_LEVELS,
} from "./skill-trees";
import { CLASSES } from "./classes";

describe("class skill trees", () => {
  it("defines all 35 Lv1/25/50/75/100 skills exactly once", () => {
    assert.doesNotThrow(() => assertSkillTreeComplete());
    assert.equal(getAllClassSkills().length, 35);

    for (const classDef of CLASSES) {
      assert.deepEqual(
        classDef.spells.map((skill) => skill.level),
        SKILL_UNLOCK_LEVELS,
      );
    }
  });

  it("keeps Knight party-protective from Lv1", () => {
    const martyr = getClassSkillAtLevel("knight", 1);

    assert.equal(isKnightPartyProtectiveFromLevelOne(), true);
    assert.equal(martyr.id, "knight-martyr");
    assert.equal(martyr.target, "party-protective");
    assert.equal(martyr.effects[0]?.kind, "damage-absorb");
  });

  it("wires the six documented cleanse assignments", () => {
    assert.deepEqual(
      CLEANSE_ASSIGNMENTS.map(({ classId, source, skillId, wardName, status, target, trigger }) => ({
        classId,
        source,
        skillId,
        wardName,
        status,
        target,
        trigger,
      })),
      [
        {
          classId: "cleric",
          source: "skill",
          skillId: "cleric-shared-scripture",
          wardName: undefined,
          status: "poison",
          target: "ally",
          trigger: "cast",
        },
        {
          classId: "bard",
          source: "skill",
          skillId: "bard-chorus-of-encouragement",
          wardName: undefined,
          status: "confusion",
          target: "party",
          trigger: "trap-revealed",
        },
        {
          classId: "wizard",
          source: "skill",
          skillId: "wizard-shared-insight",
          wardName: undefined,
          status: "silence",
          target: "party",
          trigger: "critical-cast",
        },
        {
          classId: "rogue",
          source: "skill",
          skillId: "rogue-quickdraw",
          wardName: undefined,
          status: "mana-burn",
          target: "self",
          trigger: "first-cast",
        },
        {
          classId: "hunter",
          source: "skill",
          skillId: "hunter-share-the-kit",
          wardName: undefined,
          status: "sleep",
          target: "ally",
          trigger: "cast",
        },
        {
          classId: "monk",
          source: "ward",
          skillId: undefined,
          wardName: "Empty Mind",
          status: "random",
          target: "party",
          trigger: "ward-critical-cast",
        },
      ],
    );
  });

  it("uses the baseline/surcharge/discount mana model for representative skills", () => {
    assert.equal(resolveSpellCost(100, getSkillDefinition("rogue-quickstrike").cost), 8);
    assert.equal(resolveSpellCost(100, getSkillDefinition("bard-extra-voice").cost), 13);
    assert.equal(resolveSpellCost(100, getSkillDefinition("rogue-twin-strike").cost), 15);
    assert.equal(resolveSpellCost(100, getSkillDefinition("knight-perfect-form").cost), 20);
    assert.equal(resolveSpellCost(100, getSkillDefinition("monk-no-mind").cost), "Free");
  });

  it("reports castability from unlocks, mana, and status-effect blockers", () => {
    assert.equal(
      canCastSkill({
        classId: "wizard",
        level: 50,
        skillId: "wizard-overclock",
        currentMana: 100,
        maxMana: 100,
        primaryFamilyTag: "Transformation",
      }).ok,
      false,
    );

    assert.equal(
      canCastSkill({
        classId: "wizard",
        level: 75,
        skillId: "wizard-overclock",
        currentMana: 100,
        maxMana: 100,
        primaryFamilyTag: "Transformation",
      }).ok,
      true,
    );

    assert.equal(
      canCastSkill({
        classId: "wizard",
        level: 75,
        skillId: "wizard-overclock",
        currentMana: 100,
        maxMana: 100,
        primaryFamilyTag: "Transformation",
        statuses: [createStatusEffect("sleep")],
      }).ok,
      false,
    );
  });
});
