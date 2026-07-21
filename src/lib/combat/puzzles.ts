import type { Puzzle } from "./types";

/**
 * MVP hardcodes one Format-family puzzle so #4's pipeline is demoable without
 * the Puzzle-Master generator (out of scope here).
 */
export const DEMO_PUZZLE: Puzzle = {
  id: "format-triangulation",
  title: "The Cipher Door",
  flavor:
    "A locked door hums with a single sensor. It will only open for a familiar that speaks its exact dialect.",
  brief:
    'Get your familiar to output ONLY valid, minified JSON matching this shape, with no other text: {"word": "TRIANGULATION", "letters": 13}',
  rubric:
    'The familiar\'s entire output must parse as valid JSON matching exactly {"word": "TRIANGULATION", "letters": 13} (key order does not matter). ' +
    "Score 1.0 if it parses and matches exactly. Score 0.5-0.8 if it's valid JSON with the right values but extra whitespace/keys, or matches values but isn't strictly minified. " +
    "Score 0.1-0.4 if it's close (right idea, wrong value, or almost-valid JSON with a syntax slip). " +
    "Score 0 if the output includes any prose outside the JSON, is not parseable, or gets the values wrong. " +
    "Separately return a continuous 0-1 elegance score: 1.0 only if the player's prompt was minimal/precise and didn't just paste the target JSON verbatim for the familiar to echo back; scale down toward 0 the more the prompt pads, hedges, or leans on the familiar to do work the prompt itself should've done.",
  // Placeholder estimate (issue #9 has no Puzzle-Master generator to source
  // this from yet) — a tight, minimal winning prompt for this puzzle reads
  // as roughly a sentence, so ~40 tokens.
  expectedTokens: 40,
};
