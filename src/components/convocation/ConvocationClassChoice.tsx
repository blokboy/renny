"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClassPicker } from "@/components/character";
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
  const [error, setError] = useState<string | null>(null);

  function confirmClass() {
    const draft = getCharacterDraft();
    if (!draft) {
      setError("Your hero draft is missing. Return to character creation to continue.");
      return;
    }

    const classId = CLASSES[selectedIndex].id;
    const leveled = applyXpGain({ level: 1, xp: 0 }, totalXp, classId);
    const record: CharacterRecord = {
      ...draft,
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
            The eight trials are behind you. Choose the class whose strengths match the mind you
            want to carry through the final gate.
          </p>
        </header>

        <ClassPicker selectedIndex={selectedIndex} onSelectIndex={setSelectedIndex} />

        {error && <p className="border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-100">{error}</p>}

        <button
          type="button"
          onClick={confirmClass}
          className="self-end rounded bg-emerald-400 px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-300"
        >
          Confirm {CLASSES[selectedIndex].name}
        </button>
      </main>
    </div>
  );
}
