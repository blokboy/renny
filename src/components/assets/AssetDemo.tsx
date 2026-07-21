"use client";

import { useState } from "react";
import {
  CASTLE_BACKGROUND,
  DEAD_FOREST_BACKGROUND,
  DEMO_TILE_MAP,
  MINOTAUR_PRESETS,
  SPRITE_PRESETS,
  TERRACE_BACKGROUND,
  THRONE_ROOM_BACKGROUND,
  TOWN_HUB_PLACEHOLDER_BACKGROUND,
  TUTORIAL_ZONE_BACKGROUND,
} from "@/lib/assets";
import type { CharacterSpriteConfig } from "@/lib/assets";
import { CharacterSprite } from "@/components/assets/CharacterSprite";
import { EnemySprite } from "@/components/assets/EnemySprite";
import { PresetPicker } from "@/components/assets/PresetPicker";
import { SceneBackground } from "@/components/assets/SceneBackground";
import { TileGrid } from "@/components/assets/TileGrid";

const BATTLEGROUND_SCENES = [
  DEAD_FOREST_BACKGROUND,
  CASTLE_BACKGROUND,
  TERRACE_BACKGROUND,
  THRONE_ROOM_BACKGROUND,
];

const DEFAULT_CONFIG: CharacterSpriteConfig = {
  presetId: SPRITE_PRESETS[0].id,
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

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-white">Character sprite presets</h2>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
          <div className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <CharacterSprite config={config} size={160} />
          </div>
          <div className="flex-1">
            <PresetPicker
              label="Look"
              presets={SPRITE_PRESETS}
              selectedId={config.presetId}
              onSelect={(id) => setConfig({ presetId: id })}
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
        <h2 className="text-xl font-semibold text-white">Convocation battlegrounds</h2>
        <p className="max-w-2xl text-sm text-zinc-400">
          Each trial stop&apos;s battleground, staged via the same <code>SceneBackground</code>{" "}
          convention as a single flattened composite layer (no sky/ground/decoration split in
          the source art).
        </p>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {BATTLEGROUND_SCENES.map((scene) => (
            <div key={scene.id}>
              <h3 className="mb-2 text-sm font-medium text-zinc-300">{scene.label}</h3>
              <SceneBackground
                scene={scene}
                className="aspect-video w-full rounded-lg border border-zinc-800"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-white">Convocation enemy presets</h2>
        <p className="max-w-2xl text-sm text-zinc-400">
          Each Minotaur preset&apos;s idle look next to its looping walking frame-cycle, via{" "}
          <code>EnemySprite</code>.
        </p>
        <div className="flex flex-wrap gap-8">
          {MINOTAUR_PRESETS.map((preset) => (
            <div key={preset.id} className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-zinc-300">{preset.label}</span>
              <div className="flex items-end gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex flex-col items-center gap-1">
                  <EnemySprite presetId={preset.id} pose="idle" size={110} />
                  <span className="text-[10px] tracking-wide text-zinc-500 uppercase">Idle</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <EnemySprite presetId={preset.id} pose="walking" size={110} />
                  <span className="text-[10px] tracking-wide text-zinc-500 uppercase">Walking</span>
                </div>
              </div>
            </div>
          ))}
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
