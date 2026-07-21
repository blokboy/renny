import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  inferInterrogationAnswer,
  isYesNoQuestion,
  normalizeInterrogationJudge,
} from "./interrogation";

describe("Interrogation convergence", () => {
  it("accepts yes/no forms and rejects open-ended questions", () => {
    assert.equal(isYesNoQuestion("Does it mention a key?"), true);
    assert.equal(isYesNoQuestion("Is the answer an instruction?"), true);
    assert.equal(isYesNoQuestion("What object does it mention?"), false);
  });

  it("answers from generated evidence when the model is unavailable", () => {
    const hidden = "The bronze key waits beneath the third stair.";
    const facts = ["It mentions a bronze key.", "The location is beneath the third stair."];
    assert.equal(inferInterrogationAnswer("Does it mention a key?", hidden, facts), "yes");
    assert.equal(inferInterrogationAnswer("Does it mention a silver key?", hidden, facts), "no");
    assert.equal(inferInterrogationAnswer("Does it not mention a key?", hidden, facts), "no");
  });

  it("normalizes the final Judge result to win or zero with no partial credit", () => {
    const wrong = normalizeInterrogationJudge({ score: 0.89, elegance: 0.8, feedback: "Close." });
    assert.equal(wrong.correct, false);
    assert.equal(wrong.judge.score, 0);
    assert.match(wrong.judge.feedback, /no partial credit/i);

    const correct = normalizeInterrogationJudge({ score: 0.9, elegance: 0.6, feedback: "Match." });
    assert.equal(correct.correct, true);
    assert.equal(correct.judge.score, 1);
  });
});
