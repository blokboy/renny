import Image from "next/image";
import { getSpritePreset } from "@/lib/assets";
import type { CharacterSpriteConfig } from "@/lib/assets";

export interface CharacterSpriteProps {
  config: CharacterSpriteConfig;
  /** Rendered width in pixels; height follows the preset's own aspect ratio. Defaults to 128. */
  size?: number;
  className?: string;
}

/**
 * Renders a character's chosen sprite preset. This is the single public
 * rendering surface for Renny character sprites — Character Creation, the
 * Convocation, and the Town Hub should all render sprites through this
 * component rather than reaching into `SPRITE_PRESETS` directly.
 *
 * See docs/adr/0005-character-creation-tutorial-sprite.md for why this is a
 * flat preset image rather than composable layers.
 */
export function CharacterSprite({ config, size = 128, className }: CharacterSpriteProps) {
  const preset = getSpritePreset(config.presetId);
  const height = Math.round((size * preset.imageHeight) / preset.imageWidth);

  return (
    <Image
      src={preset.imageSrc}
      alt={preset.label}
      width={size}
      height={height}
      className={className}
    />
  );
}
