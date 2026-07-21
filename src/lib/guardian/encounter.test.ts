import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  applyGuardianCast,
  assignNpcAllies,
  buildDependencyShard,
  createInitialBattleState,
  createInterrogationState,
  DIAGNOSTIC_FAMILY_BY_CLASS,
  GUARDIAN_MAX_HP,
  GUARDIAN_SHIELD_THRESHOLD,
  pickShieldFamily,
  recordInterrogationAnswer,
  submitInterrogationFinal,
} from "./encounter";

describe("Threshold Guardian encounter", () => {
  it("maps every class to its Convocation diagnostic family", () => {
    assert.deepEqual(DIAGNOSTIC_FAMILY_BY_CLASS, {
      rogue: "Format gauntlet",
      knight: "Constraint-satisfaction golf",
      wizard: "Transformation",
      bard: "Self-consistency traps",
      cleric: "Steganography-extraction",
      hunter: "Simulation-execution",
      monk: "Blind relay",
    });
  });

  it("rolls evenly across all four shield families", () => {
    assert.equal(pickShieldFamily(() => 0), "Multi-hop state tracking");
    assert.equal(pickShieldFamily(() => 0.25), "Ambiguity resolution");
    assert.equal(pickShieldFamily(() => 0.5), "Reverse-prompt");
    assert.equal(pickShieldFamily(() => 0.75), "Interrogation");
    assert.equal(pickShieldFamily(() => 0.999), "Interrogation");
  });

  it("assigns three distinct allies and excludes the player class", () => {
    const allies = assignNpcAllies("wizard", () => 0.5);
    assert.equal(allies.length, 3);
    assert.equal(new Set(allies.map(({ classId }) => classId)).size, 3);
    assert.equal(allies.some(({ classId }) => classId === "wizard"), false);
  });

  it("mechanically derives the player shard from the first NPC output", () => {
    const output = "state=17; key=blue";
    const shard = buildDependencyShard(
      "Multi-hop state tracking",
      output,
      "Advance the state twice.",
    );
    assert.match(shard, /only valid starting state/i);
    assert.match(shard, /state=17; key=blue/);
    assert.match(shard, /Advance the state twice/);
  });

  it("allows one authored question per party member and an early final submission", () => {
    const empty = createInterrogationState();
    assert.equal(submitInterrogationFinal(empty).finalSubmitted, false);

    const oneAnswer = recordInterrogationAnswer(empty, "Does it mention a key?", "yes");
    assert.deepEqual(oneAnswer.exchanges[0], {
      speakerIndex: 0,
      question: "Does it mention a key?",
      answer: "yes",
    });
    assert.equal(submitInterrogationFinal(oneAnswer).finalSubmitted, true);

    let fourAnswers = empty;
    for (let index = 0; index < 5; index += 1) {
      fourAnswers = recordInterrogationAnswer(
        fourAnswers,
        `Is clue ${index + 1} true?`,
        index % 2 === 0 ? "yes" : "no",
      );
    }
    assert.equal(fourAnswers.exchanges.length, 4);
    assert.deepEqual(fourAnswers.exchanges.map(({ speakerIndex }) => speakerIndex), [0, 1, 2, 3]);
  });

  it("stops at the shield threshold, requires a shield hit, then permits the finish", () => {
    const initial = createInitialBattleState(100, 100);
    const shield = applyGuardianCast(initial, {
      outcome: "hit",
      damage: GUARDIAN_MAX_HP,
      manaCost: 5,
      xpGained: 10,
    });
    assert.equal(shield.bossHp, GUARDIAN_SHIELD_THRESHOLD);
    assert.equal(shield.phase, "shield");

    const missed = applyGuardianCast(shield, {
      outcome: "miss",
      damage: 0,
      manaCost: 5,
      xpGained: 10,
    });
    assert.equal(missed.phase, "shield");
    assert.equal(missed.shieldBroken, false);

    const finish = applyGuardianCast(missed, {
      outcome: "hit",
      damage: 80,
      manaCost: 5,
      xpGained: 10,
    });
    assert.equal(finish.phase, "finish");
    assert.equal(finish.shieldBroken, true);
    assert.equal(finish.bossHp, GUARDIAN_SHIELD_THRESHOLD);

    const victory = applyGuardianCast(finish, {
      outcome: "hit",
      damage: GUARDIAN_SHIELD_THRESHOLD,
      manaCost: 5,
      xpGained: 10,
    });
    assert.equal(victory.phase, "victory");
    assert.equal(victory.bossHp, 0);
    assert.equal(victory.totalXpGained, 40);
  });

  it("applies fail backfire and ends the run at zero HP", () => {
    const initial = createInitialBattleState(20, 100);
    const defeated = applyGuardianCast(initial, {
      outcome: "fail",
      damage: 25,
      manaCost: 5,
      xpGained: 0,
    });
    assert.equal(defeated.playerHp, 0);
    assert.equal(defeated.phase, "defeat");
  });

  it("makes a wrong Interrogation final terminal after applying its fail penalty", () => {
    const initial = { ...createInitialBattleState(100, 100), phase: "shield" as const };
    const defeated = applyGuardianCast(initial, {
      outcome: "fail",
      damage: 50,
      manaCost: 5,
      xpGained: 0,
      terminalOnFail: true,
    });
    assert.equal(defeated.playerHp, 50);
    assert.equal(defeated.phase, "defeat");
    assert.equal(defeated.totalXpGained, 0);
  });
});
