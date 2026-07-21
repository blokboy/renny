import { generateText } from "ai";
import { z } from "zod";
import { getJudgeModel } from "@/lib/familiar/router";
import type { JudgeResult } from "@/lib/combat/types";
import type { InterrogationAnswer } from "./types";

const answerSchema = z.object({ answer: z.enum(["yes", "no"]) });

const QUESTION_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "answer",
  "contain",
  "contains",
  "does",
  "have",
  "hidden",
  "in",
  "is",
  "it",
  "mention",
  "mentions",
  "never",
  "not",
  "of",
  "or",
  "the",
  "there",
  "this",
  "to",
  "with",
]);

function terms(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 1 && !QUESTION_STOP_WORDS.has(term));
}

export function isYesNoQuestion(question: string): boolean {
  return /^(am|are|can|could|did|do|does|has|have|is|may|should|was|were|will|would)\b/i.test(
    question.trim(),
  );
}

export function inferInterrogationAnswer(
  question: string,
  hiddenAnswer: string,
  facts: string[],
): InterrogationAnswer {
  const evidence = new Set(terms(`${hiddenAnswer} ${facts.join(" ")}`));
  const subjectTerms = terms(question);
  if (subjectTerms.length === 0) return "no";

  const supported = subjectTerms.every((term) => evidence.has(term));
  const answer = supported ? "yes" : "no";
  return /\bnot\b|\bnever\b/i.test(question) ? (answer === "yes" ? "no" : "yes") : answer;
}

export async function answerInterrogationQuestion(
  question: string,
  hiddenAnswer: string,
  facts: string[],
): Promise<InterrogationAnswer> {
  try {
    const { text } = await generateText({
      model: getJudgeModel(),
      abortSignal: AbortSignal.timeout(8_000),
      system:
        "You are a truthful yes/no oracle in an Interrogation puzzle. Answer the player's question " +
        "about the hidden answer using only the supplied answer and facts. Return ONLY minified JSON " +
        "matching {\"answer\":\"yes\"|\"no\"}. If the question cannot be answered affirmatively from " +
        "the evidence, answer no.",
      prompt:
        `Hidden answer: ${hiddenAnswer}\nFacts:\n- ${facts.join("\n- ")}\n\n` +
        `Question: ${question}`,
    });
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    return answerSchema.parse(JSON.parse((fenced ? fenced[1] : text).trim())).answer;
  } catch {
    return inferInterrogationAnswer(question, hiddenAnswer, facts);
  }
}

export function normalizeInterrogationJudge(judge: JudgeResult): {
  judge: JudgeResult;
  correct: boolean;
} {
  const correct = judge.score >= 0.9;
  return {
    correct,
    judge: {
      ...judge,
      score: correct ? 1 : 0,
      feedback: correct
        ? `Correct joint prompt. ${judge.feedback}`
        : `Wrong joint prompt. Interrogation awards no partial credit. ${judge.feedback}`,
    },
  };
}
