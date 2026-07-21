import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  CASTLE_BACKGROUND,
  DEAD_FOREST_BACKGROUND,
  MINOTAUR_PRESETS,
  TERRACE_BACKGROUND,
  THRONE_ROOM_BACKGROUND,
} from "@/lib/assets";
import { getBattlegroundForStop } from "./battleground";

describe("convocation battleground staging", () => {
  it("groups stops in pairs across the four battlegrounds, in trial order", () => {
    const expectedScenes = [
      DEAD_FOREST_BACKGROUND,
      DEAD_FOREST_BACKGROUND,
      CASTLE_BACKGROUND,
      CASTLE_BACKGROUND,
      TERRACE_BACKGROUND,
      TERRACE_BACKGROUND,
      THRONE_ROOM_BACKGROUND,
      THRONE_ROOM_BACKGROUND,
    ];

    for (let stopId = 1; stopId <= 8; stopId++) {
      assert.equal(getBattlegroundForStop(stopId).scene, expectedScenes[stopId - 1]);
    }
  });

  it("cycles the Minotaur variant 1 -> 2 -> 3 -> 1 across the four groups", () => {
    const [minotaur1, minotaur2, minotaur3] = MINOTAUR_PRESETS.map((preset) => preset.id);
    const expectedEnemies = [
      minotaur1,
      minotaur1,
      minotaur2,
      minotaur2,
      minotaur3,
      minotaur3,
      minotaur1,
      minotaur1,
    ];

    for (let stopId = 1; stopId <= 8; stopId++) {
      assert.equal(getBattlegroundForStop(stopId).enemyPresetId, expectedEnemies[stopId - 1]);
    }
  });

  it("throws for an out-of-range stop id", () => {
    assert.throws(() => getBattlegroundForStop(0));
    assert.throws(() => getBattlegroundForStop(9));
  });
});
