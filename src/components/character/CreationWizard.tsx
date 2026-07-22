"use client";

import { useRouter } from "next/navigation";
import { SPRITE_PRESETS } from "@/lib/assets";
import type { CharacterSpriteConfig } from "@/lib/assets";
import { saveCharacterDraft } from "@/lib/character";
import type { CharacterDraft } from "@/lib/character";

const DEFAULT_SPRITE: CharacterSpriteConfig = {
  presetId: SPRITE_PRESETS[0].id,
};

/**
 * Character Creation is now just the gate into the Convocation — name and
 * appearance both happen later, together, once the trials are behind the
 * player: the class they choose comes with its own look, which becomes
 * their hero's permanent skin through the Threshold Guardian (see
 * `ConvocationClassChoice`). So there's nothing to fill in here; confirming
 * just saves a placeholder `CharacterDraft` — an empty name and one of the
 * tutorial-phase Wraith looks (only ever seen during the Convocation
 * trials themselves) — and moves on. See docs/adr/0005.
 */
export function CreationWizard() {
  const router = useRouter();

  function begin() {
    const draft: CharacterDraft = {
      name: "",
      sprite: DEFAULT_SPRITE,
      createdAt: new Date().toISOString(),
    };
    saveCharacterDraft(draft);
    router.push("/convocation");
  }

  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        onClick={begin}
        className="rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400"
      >
        Enter the Convocation
      </button>
    </div>
  );
}
