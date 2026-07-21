"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SPRITE_PRESETS } from "@/lib/assets";
import type { CharacterSpriteConfig } from "@/lib/assets";
import { saveCharacterDraft } from "@/lib/character";
import type { CharacterDraft } from "@/lib/character";
import { SpriteCustomizer } from "./SpriteCustomizer";
import { NameInput, NAME_MAX_LENGTH } from "./NameInput";

const DEFAULT_SPRITE: CharacterSpriteConfig = {
  presetId: SPRITE_PRESETS[0].id,
};

/**
 * Orchestrates the name+appearance portion of Character Creation (issue
 * #3): both shown together on one page. Class selection is deferred to
 * just before the Threshold Guardian rather than happening here — so
 * confirming saves a `CharacterDraft` (`@/lib/character`), not a full
 * `CharacterRecord`, and moves straight on to the Convocation map. See
 * docs/adr/0002-character-creation.md.
 */
export function CreationWizard() {
  const router = useRouter();
  const [sprite, setSprite] = useState<CharacterSpriteConfig>(DEFAULT_SPRITE);
  const [name, setName] = useState("");

  const trimmedName = name.trim();
  const nameValid = trimmedName.length > 0 && trimmedName.length <= NAME_MAX_LENGTH;

  function confirmDraft() {
    const draft: CharacterDraft = {
      name: trimmedName,
      sprite,
      createdAt: new Date().toISOString(),
    };
    saveCharacterDraft(draft);
    router.push("/convocation");
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <NameInput value={name} onChange={setName} />
      </section>

      <section className="flex flex-col gap-4 border-t border-zinc-800 pt-8">
        <h2 className="text-sm font-medium tracking-wide text-zinc-400 uppercase">Appearance</h2>
        <SpriteCustomizer config={sprite} onChange={setSprite} />
      </section>

      <div className="flex items-center justify-end border-t border-zinc-800 pt-6">
        <button
          type="button"
          onClick={confirmDraft}
          disabled={!nameValid}
          className="rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Enter the Convocation
        </button>
      </div>
    </div>
  );
}
