import { CLASSES, type ClassId } from "@/lib/character";
import { generateGuardianEncounter } from "@/lib/guardian/generator";

function isClassId(value: unknown): value is ClassId {
  return typeof value === "string" && CLASSES.some(({ id }) => id === value);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!isClassId(body?.classId)) {
    return Response.json({ error: "valid classId is required" }, { status: 400 });
  }

  const encounter = await generateGuardianEncounter(body.classId);
  return Response.json(encounter);
}
