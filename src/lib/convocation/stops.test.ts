import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { PUZZLE_FAMILIES } from "../combat/typeChart";
import { CONVOCATION_STOPS, getConvocationStop } from "./stops";

describe("convocation stops", () => {
  it("defines the 8 fixed stops in order with unique authored puzzles", () => {
    assert.deepEqual(
      CONVOCATION_STOPS.map((stop) => stop.id),
      [1, 2, 3, 4, 5, 6, 7, 8],
    );
    assert.equal(new Set(CONVOCATION_STOPS.map((stop) => stop.puzzle.id)).size, 8);

    for (const stop of CONVOCATION_STOPS) {
      assert.equal(getConvocationStop(stop.id), stop);
      assert.ok(stop.boundFamiliar.length > 0);
      assert.ok(stop.hint.length > 0);
      assert.ok(stop.probeReveal.startsWith("Probe:"));
      assert.ok(stop.puzzle.brief.length > 0);
      assert.ok(stop.puzzle.rubric.length > 0);
      assert.ok(stop.puzzle.expectedTokens > 0);
    }
  });

  it("keeps stops 1-7 diagnostic and stop 8 as the non-diagnostic Ward lesson", () => {
    const knownFamilies = new Set<string>(PUZZLE_FAMILIES);
    const diagnosticStops = CONVOCATION_STOPS.slice(0, 7);

    for (const stop of diagnosticStops) {
      assert.notEqual(stop.boundClass, "universal");
      assert.equal(knownFamilies.has(stop.family), true);
      assert.equal(stop.wardLesson, undefined);
    }

    const finalStop = CONVOCATION_STOPS[7];
    assert.equal(finalStop.id, 8);
    assert.equal(finalStop.family, "Adversarial-text-injection");
    assert.equal(finalStop.boundClass, "universal");
    assert.match(finalStop.probeReveal, /not diagnostic/i);
    assert.match(finalStop.wardLesson ?? "", /trusted/i);
    assert.match(finalStop.wardLesson ?? "", /untrusted/i);
  });
});
