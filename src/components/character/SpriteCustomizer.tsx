import { SPRITE_PRESETS } from "@/lib/assets";
import type { CharacterSpriteConfig } from "@/lib/assets";
import { CharacterSprite } from "@/components/assets/CharacterSprite";
import { PresetPicker } from "@/components/assets/PresetPicker";

export interface SpriteCustomizerProps {
  config: CharacterSpriteConfig;
  onChange: (config: CharacterSpriteConfig) => void;
}

/**
 * The "choose your look" step of Character Creation. Before a class is
 * chosen there's no class-specific art yet, so the player picks one of the
 * tutorial-phase presets from `public/assets/character_creation` — see
 * docs/adr/0005-character-creation-tutorial-sprite.md.
 */
export function SpriteCustomizer({ config, onChange }: SpriteCustomizerProps) {
  return (
    <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
      <div className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <CharacterSprite config={config} size={160} />
      </div>
      <div className="flex-1">
        <PresetPicker
          label="Look"
          presets={SPRITE_PRESETS}
          selectedId={config.presetId}
          onSelect={(id) => onChange({ presetId: id })}
        />
      </div>
    </div>
  );
}
