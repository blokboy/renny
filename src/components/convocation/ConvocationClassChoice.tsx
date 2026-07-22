"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClassPicker, NameInput, NAME_MAX_LENGTH } from "@/components/character";
import {
  CLASSES,
  clearCharacterDraft,
  getCharacterDraft,
  getStartingHp,
  getStartingMana,
  saveCharacter,
  type CharacterRecord,
} from "@/lib/character";
import { applyXpGain } from "@/lib/xp";

export function ConvocationClassChoice({ totalXp }: { totalXp: number }) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [name, setName] = useState(() => getCharacterDraft()?.name ?? "");
  const [error, setError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const nameValid = trimmedName.length > 0 && trimmedName.length <= NAME_MAX_LENGTH;

  function confirmClass() {
    const draft = getCharacterDraft();
    if (!draft) {
      setError("Your hero draft is missing. Return to character creation to continue.");
      return;
    }
    if (!nameValid) {
      setError("Name your hero before binding a familiar.");
      return;
    }

    const classId = CLASSES[selectedIndex].id;
    const leveled = applyXpGain({ level: 1, xp: 0 }, totalXp, classId);
    const record: CharacterRecord = {
      ...draft,
      name: trimmedName,
      // The class's own preset becomes the hero's permanent look from here
      // on — supersedes the tutorial-phase Wraith look picked (invisibly)
      // for the Convocation trials. See `SPRITE_PRESETS` in `@/lib/assets`.
      sprite: { presetId: classId },
      classId,
      stats: leveled.stats,
      startingHp: getStartingHp(leveled.stats),
      startingMana: getStartingMana(leveled.stats),
      level: leveled.state.level,
      xp: leveled.state.xp,
    };

    saveCharacter(record);
    clearCharacterDraft();
    router.push("/character/recap");
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-zinc-950/95 px-4 py-8 text-white">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header>
          <p className="font-mono text-xs tracking-wide text-emerald-300 uppercase">
            Convocation complete · {totalXp} XP banked
          </p>
          <h1 className="mt-2 text-3xl font-bold">Bind your familiar</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            The eight trials are behind you. Name your hero, then choose the class whose
            strengths match the mind you want to carry through the final gate — that class&rsquo;s own
            look becomes your hero&rsquo;s, all the way to the Threshold Guardian.
          </p>
        </header>

        <NameInput value={name} onChange={setName} />

        <ClassPicker selectedIndex={selectedIndex} onSelectIndex={setSelectedIndex} />

        {error && <p className="border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-100">{error}</p>}

        <button
          type="button"
          onClick={confirmClass}
          disabled={!nameValid}
          className="self-end rounded bg-emerald-400 px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Confirm {CLASSES[selectedIndex].name}
        </button>
      </main>
    </div>
  );
}
