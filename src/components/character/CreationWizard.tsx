"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BODY_VARIANTS,
  HAIR_COLORS,
  HAIR_VARIANTS,
  HEAD_VARIANTS,
  SKIN_TONES,
} from "@/lib/assets";
import type { CharacterSpriteConfig } from "@/lib/assets";
import {
  CLASSES,
  STARTING_STATS,
  getStartingHp,
  getStartingMana,
  saveCharacter,
} from "@/lib/character";
import type { CharacterRecord } from "@/lib/character";
import { SpriteCustomizer } from "./SpriteCustomizer";
import { NameEntryGrid, NAME_MAX_LENGTH } from "./NameEntryGrid";
import { ClassPicker } from "./ClassPicker";

const DEFAULT_SPRITE: CharacterSpriteConfig = {
  bodyVariantId: BODY_VARIANTS[0].id,
  headVariantId: HEAD_VARIANTS[0].id,
  hairVariantId: HAIR_VARIANTS[0].id,
  skinToneId: SKIN_TONES[0].id,
  hairColorId: HAIR_COLORS[0].id,
};

type Step = "sprite" | "name" | "class";
const STEPS: Step[] = ["sprite", "name", "class"];
const STEP_LABELS: Record<Step, string> = {
  sprite: "Appearance",
  name: "Name",
  class: "Class",
};

/**
 * Orchestrates the full Character Creation flow (issue #3): sprite
 * customization -> retro name entry -> paged class picker -> confirm.
 * Draft state (sprite/name/class-being-browsed) lives in React state only;
 * nothing is persisted until the player confirms a class, at which point a
 * `CharacterRecord` is built and saved (`@/lib/character`) and the router
 * moves on to `/character/recap`. See docs/adr/0002-character-creation.md.
 */
export function CreationWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("sprite");
  const [sprite, setSprite] = useState<CharacterSpriteConfig>(DEFAULT_SPRITE);
  const [name, setName] = useState("");
  const [classIndex, setClassIndex] = useState(0);

  const stepIndex = STEPS.indexOf(step);
  const trimmedName = name.trim();

  function goNext() {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  }

  function confirmClass() {
    const classDef = CLASSES[classIndex];
    const stats = STARTING_STATS[classDef.id];
    const record: CharacterRecord = {
      name: trimmedName,
      classId: classDef.id,
      sprite,
      stats,
      startingHp: getStartingHp(stats),
      startingMana: getStartingMana(stats),
      level: 1,
      xp: 0,
      createdAt: new Date().toISOString(),
    };
    saveCharacter(record);
    router.push("/character/recap");
  }

  return (
    <div className="flex flex-col gap-8">
      <ol className="flex gap-4 text-sm">
        {STEPS.map((s, index) => (
          <li
            key={s}
            className={`flex items-center gap-2 ${
              index === stepIndex ? "text-white" : "text-zinc-600"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                index === stepIndex
                  ? "bg-emerald-500 text-zinc-950"
                  : index < stepIndex
                    ? "bg-zinc-700 text-zinc-300"
                    : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {index + 1}
            </span>
            {STEP_LABELS[s]}
          </li>
        ))}
      </ol>

      {step === "sprite" && <SpriteCustomizer config={sprite} onChange={setSprite} />}
      {step === "name" && <NameEntryGrid value={name} onChange={setName} />}
      {step === "class" && (
        <ClassPicker selectedIndex={classIndex} onSelectIndex={setClassIndex} />
      )}

      <div className="flex items-center justify-between border-t border-zinc-800 pt-6">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Back
        </button>

        {step !== "class" ? (
          <button
            type="button"
            onClick={goNext}
            disabled={step === "name" && trimmedName.length === 0}
            className="rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={confirmClass}
            disabled={trimmedName.length === 0 || trimmedName.length > NAME_MAX_LENGTH}
            className="rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Confirm {CLASSES[classIndex].name}
          </button>
        )}
      </div>
    </div>
  );
}
