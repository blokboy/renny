"use client";

import { useState } from "react";
import {
  BODY_VARIANTS,
  DEMO_TILE_MAP,
  HAIR_COLORS,
  HAIR_VARIANTS,
  HEAD_VARIANTS,
  SKIN_TONES,
  TOWN_HUB_PLACEHOLDER_BACKGROUND,
  TUTORIAL_ZONE_BACKGROUND,
} from "@/lib/assets";
import type { CharacterSpriteConfig } from "@/lib/assets";
import { CharacterSprite } from "@/components/assets/CharacterSprite";
import { SwatchPicker } from "@/components/assets/SwatchPicker";
import { VariantPicker } from "@/components/assets/VariantPicker";
import { SceneBackground } from "@/components/assets/SceneBackground";
import { TileGrid } from "@/components/assets/TileGrid";

const DEFAULT_CONFIG: CharacterSpriteConfig = {
  bodyVariantId: BODY_VARIANTS[0].id,
  headVariantId: HEAD_VARIANTS[0].id,
  hairVariantId: HAIR_VARIANTS[0].id,
  skinToneId: SKIN_TONES[0].id,
  hairColorId: HAIR_COLORS[0].id,
};

/**
 * Interactive contents of the /dev/assets debug page: a character sprite
 * composer (swatches + layer variants) and a preview of the shared
 * background/tileset convention. This component only exists to demonstrate
 * the asset system — real consumers should compose `CharacterSprite`,
 * `SceneBackground`, and the picker components directly.
 */
export function AssetDemo() {
  const [config, setConfig] = useState<CharacterSpriteConfig>(DEFAULT_CONFIG);

  function set<K extends keyof CharacterSpriteConfig>(key: K, value: CharacterSpriteConfig[K]) {
    setConfig((previous) => ({ ...previous, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-white">Character sprite composer</h2>
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
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-white">Shared background convention</h2>
        <p className="max-w-2xl text-sm text-zinc-400">
          Scenes are composed from layered sky/ground/decoration images (or flat-color
          fallbacks) via <code>SceneBackground</code>. The tutorial-zone scene below uses real
          layered art staged in <code>public/assets</code>; the Town Hub preset shows the same
          convention with flat-color placeholders standing in until real art exists.
        </p>
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="mb-2 text-sm font-medium text-zinc-300">
              {TUTORIAL_ZONE_BACKGROUND.label}
            </h3>
            <SceneBackground
              scene={TUTORIAL_ZONE_BACKGROUND}
              className="aspect-[3/4] w-full max-w-sm rounded-lg border border-zinc-800"
            >
              <div className="flex h-full items-end p-4">
                <CharacterSprite config={config} size={96} />
              </div>
            </SceneBackground>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-zinc-300">
              {TOWN_HUB_PLACEHOLDER_BACKGROUND.label}
            </h3>
            <SceneBackground
              scene={TOWN_HUB_PLACEHOLDER_BACKGROUND}
              className="aspect-video w-full max-w-2xl rounded-lg border border-zinc-800"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-white">Shared tileset convention</h2>
        <p className="max-w-2xl text-sm text-zinc-400">
          A small fixed-size tile registry (<code>TILE_TYPES</code>, 32px tiles) for building
          simple ground/collision maps out of flat colors.
        </p>
        <TileGrid tileMap={DEMO_TILE_MAP} className="rounded border border-zinc-800" />
      </section>
    </div>
  );
}
