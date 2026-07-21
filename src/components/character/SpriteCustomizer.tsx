import {
  BODY_VARIANTS,
  HAIR_COLORS,
  HAIR_VARIANTS,
  HEAD_VARIANTS,
  SKIN_TONES,
} from "@/lib/assets";
import type { CharacterSpriteConfig } from "@/lib/assets";
import { CharacterSprite } from "@/components/assets/CharacterSprite";
import { SwatchPicker } from "@/components/assets/SwatchPicker";
import { VariantPicker } from "@/components/assets/VariantPicker";

export interface SpriteCustomizerProps {
  config: CharacterSpriteConfig;
  onChange: (config: CharacterSpriteConfig) => void;
}

/**
 * The "choose your look" step of Character Creation: skin tone/hair color
 * swatches plus body/head/hair variant pickers, built entirely on top of the
 * shared Asset Mapping system (#2 / ADR 0001) — no new sprite plumbing
 * lives here.
 */
export function SpriteCustomizer({ config, onChange }: SpriteCustomizerProps) {
  function set<K extends keyof CharacterSpriteConfig>(key: K, value: CharacterSpriteConfig[K]) {
    onChange({ ...config, [key]: value });
  }

  return (
    <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
      <div className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <CharacterSprite config={config} size={160} />
      </div>
      <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
        <VariantPicker
          label="Body"
          variants={BODY_VARIANTS}
          selectedId={config.bodyVariantId}
          onSelect={(id) => set("bodyVariantId", id)}
        />
        <VariantPicker
          label="Head"
          variants={HEAD_VARIANTS}
          selectedId={config.headVariantId}
          onSelect={(id) => set("headVariantId", id)}
        />
        <VariantPicker
          label="Hair style"
          variants={HAIR_VARIANTS}
          selectedId={config.hairVariantId}
          onSelect={(id) => set("hairVariantId", id)}
        />
        <div aria-hidden className="hidden sm:block" />
        <SwatchPicker
          label="Skin tone"
          swatches={SKIN_TONES}
          selectedId={config.skinToneId}
          onSelect={(id) => set("skinToneId", id)}
        />
        <SwatchPicker
          label="Hair color"
          swatches={HAIR_COLORS}
          selectedId={config.hairColorId}
          onSelect={(id) => set("hairColorId", id)}
        />
      </div>
    </div>
  );
}
