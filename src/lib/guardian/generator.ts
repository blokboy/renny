import { generateText } from "ai";
import { z } from "zod";
import { getJudgeModel } from "@/lib/familiar/router";
import type { ClassId } from "@/lib/character";
import type { PuzzleFamily } from "@/lib/combat/typeChart";
import {
  assignNpcAllies,
  buildDependencyShard,
  DIAGNOSTIC_FAMILY_BY_CLASS,
  pickShieldFamily,
} from "./encounter";
import type {
  GuardianAlly,
  GuardianDependencyFamily,
  GuardianEncounter,
  GuardianPuzzle,
} from "./types";

const generatedPuzzleSchema = z.object({
  title: z.string().min(1),
  flavor: z.string().min(1),
  brief: z.string().min(1),
  rubric: z.string().min(1),
  expectedTokens: z.number().int().positive(),
});

const dependencyEncounterSchema = z.object({
  solo: generatedPuzzleSchema,
  solo2: generatedPuzzleSchema,
  shield: z.object({
    title: z.string().min(1),
    flavor: z.string().min(1),
    npcTask: z.string().min(1),
    npcOutput: z.string().min(1),
    handoffInstruction: z.string().min(1),
    rubric: z.string().min(1),
    expectedTokens: z.number().int().positive(),
  }),
});

const interrogationEncounterSchema = z.object({
  solo: generatedPuzzleSchema,
  solo2: generatedPuzzleSchema,
  shield: z.object({
    title: z.string().min(1),
    flavor: z.string().min(1),
    brief: z.string().min(1),
    hiddenAnswer: z.string().min(1),
    facts: z.array(z.string().min(1)).min(3),
    rubric: z.string().min(1),
    expectedTokens: z.number().int().positive(),
  }),
});

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

function makePuzzle(
  id: string,
  family: PuzzleFamily,
  generated: z.infer<typeof generatedPuzzleSchema>,
): GuardianPuzzle {
  return { id, family, ...generated };
}

function proceduralSolo(soloFamily: PuzzleFamily, seed: number) {
  const a = 4 + (seed % 7);
  const candidateB = 3 + (Math.floor(seed / 7) % 5);
  const b = candidateB === a ? candidateB + 1 : candidateB;
  const final = a * 2 + b - 1;
  const unused = {
    title: "Unused family",
    flavor: "This branch is not selected for a diagnostic opening.",
    brief: "Unused.",
    rubric: "Unused.",
    expectedTokens: 1,
  };
  const soloByFamily: Record<PuzzleFamily, z.infer<typeof generatedPuzzleSchema>> = {
    Transformation: {
      title: "The Changing Sigil",
      flavor: "Three runes pulse in sequence across the Guardian's brow.",
      brief: `Infer the rule from ${a} -> ${a * 2 + 1} and ${b} -> ${b * 2 + 1}, then apply it to ${a + b}.`,
      rubric: `Score 1 for ${2 * (a + b) + 1} with the rule 2n+1 explained; partial credit for the answer without a stable rule.`,
      expectedTokens: 44,
    },
    "Constraint-satisfaction golf": {
      title: "The Bound Oath",
      flavor: "The Guardian accepts only a phrase with every edge sealed.",
      brief: `Produce exactly ${b} words. The first must begin with G, the last must end with T, and the phrase must describe opening a gate.`,
      rubric: `Score 1 only when all constraints hold: exactly ${b} words, initial G, final T, and gate-opening meaning.`,
      expectedTokens: 38,
    },
    "Format gauntlet": {
      title: "The Exacting Seal",
      flavor: "A brass lock waits for one machine-perfect answer.",
      brief: `Return only minified JSON with keys "sum" and "product" for ${a} and ${b}.`,
      rubric: `Score 1 only for valid JSON equivalent to {"sum":${a + b},"product":${a * b}} with no prose.`,
      expectedTokens: 34,
    },
    "Adversarial-text-injection": unused,
    "Blind relay": {
      title: "The Covered Dial",
      flavor: "Only your description can cross the veil to the familiar.",
      brief: `Tell the familiar to compute twice ${a}, add ${b}, then subtract one. Do not include the result yourself.`,
      rubric: `Score 1 for the final value ${final}; favor a compact, lossless relay.`,
      expectedTokens: 36,
    },
    "Multi-hop state tracking": unused,
    "Self-consistency traps": {
      title: "The Mirrored Claim",
      flavor: "Three reflections offer answers; only agreement after checking is safe.",
      brief: `Solve ${a} * ${b} + ${a}, verify it a second way, and return the checked result.`,
      rubric: `Score 1 for ${a * b + a} with an independent verification; partial credit for an unverified answer.`,
      expectedTokens: 48,
    },
    "Simulation-execution": {
      title: "The Clockwork March",
      flavor: "A tiny automaton clicks beneath the Guardian's shield.",
      brief: `Start at ${a}. Repeat ${b} times: add 2, then double. Return only the final state.`,
      rubric: `Execute all ${b} steps exactly. Score 1 only for the correct final state with no invented step.`,
      expectedTokens: 46,
    },
    Interrogation: unused,
    "Steganography-extraction": {
      title: "The Archive Thread",
      flavor: "A weathered inscription hides a command in plain sight.",
      brief: "Extract the first letter of each sentence: Gather every clue. Attend to beginnings. Turn away from ornament. Enter only the hidden word.",
      rubric: "Score 1 for GATE and partial credit for identifying the acrostic method.",
      expectedTokens: 40,
    },
    "Ambiguity resolution": unused,
    "Reverse-prompt": unused,
  };
  return { solo: soloByFamily[soloFamily], a, b, final };
}

function proceduralDependencyFallback(
  soloFamily: PuzzleFamily,
  shieldFamily: GuardianDependencyFamily,
  seed: number,
): z.infer<typeof dependencyEncounterSchema> {
  const { solo, a, b, final } = proceduralSolo(soloFamily, seed);
  const { solo: solo2 } = proceduralSolo(soloFamily, seed + 1);
  const npcOutput = shieldFamily === "Reverse-prompt" ? `The sealed number is ${final}.` : `Start=${a}; key=${b}; state=${final}.`;
  const handoffByFamily: Record<GuardianDependencyFamily, string> = {
    "Multi-hop state tracking": `Continue from that exact state: add ${b}, swap the first and last digits if possible, and report each transition.`,
    "Ambiguity resolution": "State the assumption encoded by the ally, then give one answer that stays consistent with it.",
    "Reverse-prompt": "Write a general prompt that makes your familiar produce the target without quoting the target verbatim.",
  };
  return {
    solo,
    solo2,
    shield: {
      title: "The Dependent Seal",
      flavor: "Three allied sigils ignite. One must speak before another can exist.",
      npcTask: "Resolve the opening shard and publish the state the next caster must inherit.",
      npcOutput,
      handoffInstruction: handoffByFamily[shieldFamily],
      rubric: `Score 1 for an answer that correctly consumes the ally output and completes the dependent instruction. Score 0.3-0.8 for partial but consistent work. Score 0 for ignoring or contradicting the ally output.${shieldFamily === "Reverse-prompt" ? " Hard zero if the prompt quotes the target output verbatim." : ""}`,
      expectedTokens: 62,
    },
  };
}

function proceduralInterrogationFallback(
  soloFamily: PuzzleFamily,
  seed: number,
): z.infer<typeof interrogationEncounterSchema> {
  const { solo } = proceduralSolo(soloFamily, seed);
  const { solo: solo2 } = proceduralSolo(soloFamily, seed + 1);
  const targets = [
    {
      answer: "The bronze key waits beneath the third stair.",
      facts: ["It is one declarative sentence.", "It mentions a bronze key.", "The location is beneath the third stair."],
    },
    {
      answer: "At dawn, ring the western bell twice.",
      facts: ["It is an instruction.", "It happens at dawn.", "It mentions the western bell and the number two."],
    },
    {
      answer: "A quiet river remembers every silver moon.",
      facts: ["It is poetic rather than instructional.", "It mentions a river.", "It connects memory with a silver moon."],
    },
    {
      answer: "Return the red compass to the northern tower.",
      facts: ["It is an instruction.", "The object is a red compass.", "The destination is the northern tower."],
    },
  ];
  const target = targets[seed % targets.length];
  return {
    solo,
    solo2,
    shield: {
      title: "The Veiled Answer",
      flavor: "The Guardian seals an answer behind four yes-or-no sigils.",
      brief: "Ask up to four yes/no questions, one through each party member. After any answer, submit one joint prompt intended to make your familiar reproduce the hidden answer.",
      hiddenAnswer: target.answer,
      facts: target.facts,
      rubric: `The hidden target is exactly: ${JSON.stringify(target.answer)}. Score 1 only when the familiar output reproduces the same meaning and essential details. Anything else is wrong; do not award partial credit. Elegance favors a general prompt that infers the answer from the party's yes/no evidence.`,
      expectedTokens: 72,
    },
  };
}

async function askDependencyPuzzleMaster(
  playerClassId: ClassId,
  soloFamily: PuzzleFamily,
  shieldFamily: GuardianDependencyFamily,
) {
  const { text } = await generateText({
    model: getJudgeModel(),
    abortSignal: AbortSignal.timeout(8_000),
    system:
      "You are the Puzzle-Master for a prompt-engineering RPG. Generate fair, compact tutorial combat puzzles. " +
      "Return ONLY JSON. Never reveal answers in player-facing briefs. The shield puzzle must be a Dependency Lock: " +
      "an NPC output must create information required by a later player shard.",
    prompt:
      `Player class: ${playerClassId}. Solo family: ${soloFamily}. Shield family: ${shieldFamily}.\n` +
      "Return {solo:{title,flavor,brief,rubric,expectedTokens},solo2:{title,flavor,brief,rubric,expectedTokens},shield:{title,flavor,npcTask,npcOutput,handoffInstruction,rubric,expectedTokens}}. " +
      "`solo` and `solo2` are two distinct puzzles of the same family — different specifics (numbers, phrasing, targets) so the second never repeats the first. " +
      "Rubrics must define hit/partial/fail scoring and an elegance axis. Keep expectedTokens between 30 and 100.",
  });
  return dependencyEncounterSchema.parse(JSON.parse(extractJson(text)));
}

async function askInterrogationPuzzleMaster(playerClassId: ClassId, soloFamily: PuzzleFamily) {
  const { text } = await generateText({
    model: getJudgeModel(),
    abortSignal: AbortSignal.timeout(8_000),
    system:
      "You are the Puzzle-Master for a prompt-engineering RPG. Generate a fair Interrogation convergence puzzle. " +
      "The party may ask four yes/no questions before writing one reverse prompt for a hidden answer. Return ONLY JSON. " +
      "The public brief must not reveal the hidden answer. Facts must be sufficient to answer questions consistently.",
    prompt:
      `Player class: ${playerClassId}. Solo family: ${soloFamily}.\n` +
      "Return {solo:{title,flavor,brief,rubric,expectedTokens},solo2:{title,flavor,brief,rubric,expectedTokens},shield:{title,flavor,brief,hiddenAnswer,facts,rubric,expectedTokens}}. " +
      "`solo` and `solo2` are two distinct puzzles of the same family — different specifics (numbers, phrasing, targets) so the second never repeats the first. " +
      "The shield rubric must identify the hidden answer and require semantic equivalence with no partial credit.",
  });
  return interrogationEncounterSchema.parse(JSON.parse(extractJson(text)));
}

export async function generateGuardianEncounter(
  playerClassId: ClassId,
  rng: () => number = Math.random,
): Promise<GuardianEncounter> {
  const soloFamily = DIAGNOSTIC_FAMILY_BY_CLASS[playerClassId];
  const shieldFamily = pickShieldFamily(rng);
  const allies = assignNpcAllies(playerClassId, rng);
  const seed = Math.floor(rng() * 10_000);
  const encounterId = `guardian-${Date.now()}-${seed}`;

  if (shieldFamily === "Interrogation") {
    let generated;
    try {
      generated = await askInterrogationPuzzleMaster(playerClassId, soloFamily);
    } catch {
      generated = proceduralInterrogationFallback(soloFamily, seed);
    }
    return {
      id: encounterId,
      generatedAt: new Date().toISOString(),
      playerClassId,
      soloPuzzles: [
        makePuzzle(`${encounterId}-solo`, soloFamily, generated.solo),
        makePuzzle(`${encounterId}-solo-2`, soloFamily, generated.solo2),
      ],
      allies,
      shield: {
        kind: "interrogation",
        family: "Interrogation",
        puzzle: makePuzzle(`${encounterId}-shield`, "Interrogation", {
          title: generated.shield.title,
          flavor: generated.shield.flavor,
          brief: generated.shield.brief,
          rubric: generated.shield.rubric,
          expectedTokens: generated.shield.expectedTokens,
        }),
        hiddenAnswer: generated.shield.hiddenAnswer,
        facts: generated.shield.facts,
      },
    };
  }

  let generated;
  try {
    generated = await askDependencyPuzzleMaster(playerClassId, soloFamily, shieldFamily);
  } catch {
    generated = proceduralDependencyFallback(soloFamily, shieldFamily, seed);
  }
  const playerShard = buildDependencyShard(
    shieldFamily,
    generated.shield.npcOutput,
    generated.shield.handoffInstruction,
  );
  return {
    id: encounterId,
    generatedAt: new Date().toISOString(),
    playerClassId,
    soloPuzzles: [
      makePuzzle(`${encounterId}-solo`, soloFamily, generated.solo),
      makePuzzle(`${encounterId}-solo-2`, soloFamily, generated.solo2),
    ],
    allies,
    shield: {
      kind: "dependency-lock",
      family: shieldFamily,
      puzzle: makePuzzle(`${encounterId}-shield`, shieldFamily, {
        title: generated.shield.title,
        flavor: generated.shield.flavor,
        brief: playerShard,
        rubric: generated.shield.rubric,
        expectedTokens: generated.shield.expectedTokens,
      }),
      firstCaster: allies[0] as GuardianAlly,
      npcTask: generated.shield.npcTask,
      npcOutput: generated.shield.npcOutput,
      handoffInstruction: generated.shield.handoffInstruction,
      playerShard,
    },
  };
}
