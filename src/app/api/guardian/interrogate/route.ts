import { answerInterrogationQuestion, isYesNoQuestion } from "@/lib/guardian/interrogation";

export async function POST(request: Request) {
  const body = await request.json();
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const hiddenAnswer = typeof body?.hiddenAnswer === "string" ? body.hiddenAnswer.trim() : "";
  const facts = Array.isArray(body?.facts)
    ? body.facts.filter((fact: unknown): fact is string => typeof fact === "string" && fact.length > 0)
    : [];

  if (!question || !hiddenAnswer || facts.length === 0) {
    return Response.json({ error: "question and interrogation evidence are required" }, { status: 400 });
  }
  if (!isYesNoQuestion(question)) {
    return Response.json({ error: "question must be answerable with yes or no" }, { status: 400 });
  }

  const answer = await answerInterrogationQuestion(question, hiddenAnswer, facts);
  return Response.json({ answer });
}
