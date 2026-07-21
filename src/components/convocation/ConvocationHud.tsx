import Image from "next/image";
import type { Outcome } from "@/lib/combat/types";

export interface ConvocationHudProps {
  playerSpritePresetId: string;
  enemyPresetId: string;
  /** The Judge's resolved outcome for the current cast, once known — drains the losing side's Health meter. */
  outcome: Outcome | null;
}

interface MeterProps {
  label: string;
  tone: string;
  /** Drains the bar to empty (combat resolution) instead of showing it full. */
  depleted?: boolean;
}

function Meter({ label, tone, depleted = false }: MeterProps) {
  return (
    <div className="min-w-16 sm:min-w-36">
      <p className="mb-0.5 text-[8px] tracking-[0.18em] text-white/70 uppercase">{label}</p>
      <div className="h-2 overflow-hidden rounded-full bg-black/50">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-in ${tone} ${depleted ? "w-0" : "w-full"}`}
        />
      </div>
    </div>
  );
}

const PORTRAIT_SIZE = 48;

/**
 * Rendered width of one `ActorHud` block, corner offset included.
 *
 * Below `sm`, the block stacks the portrait above the meter column (see
 * `ActorHud`) so its width is just the wider of the two — portrait
 * (`PORTRAIT_SIZE`) vs. the `Meter` column's `min-w-16` — plus padding and
 * the block's `left`/`right` corner offset. At `sm` and up it goes back to
 * a single row: portrait + `gap-3` + `min-w-36` meter column + padding +
 * offset. Exported so `ConvocationEncounter` can keep the puzzle panel
 * clear of both HUD blocks without guessing at their size.
 */
export const HUD_FOOTPRINT_PX = {
  base: 12 /* left-3 */ + Math.max(48 /* portrait */, 64) /* min-w-16 */ + 8 * 2 /* px-2 */,
  sm: 24 /* sm:left-6 */ + (48 /* portrait */ + 12 /* gap-3 */ + 144) /* sm:min-w-36 */ + 16 * 2 /* sm:px-4 */,
} as const;

interface PortraitCrop {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  /** Center of the desired crop (face/eyes), in the source image's native pixels. */
  cropCenterX: number;
  cropCenterY: number;
  /** Width of the crop box, in native pixels — the portrait is scaled so this fills PORTRAIT_SIZE. */
  cropWidth: number;
}

/**
 * The raw rig `Head.png` parts have no face baked in (eyes/mouth are a
 * separate "Face" overlay with rig-specific offsets we don't have data for),
 * so the portrait crops instead zoom into the already fully-composited art:
 * the Wraith's flat preset image, and the Minotaur's first Idle frame.
 */
function wraithPortrait(presetId: string): PortraitCrop {
  const match = presetId.match(/(\d+)$/);
  if (!match) {
    throw new Error(`Cannot derive a Wraith number from preset id "${presetId}"`);
  }
  const n = match[1].padStart(2, "0");
  return {
    src: `/assets/character_creation/presets/wraith-${n}.png`,
    naturalWidth: 520,
    naturalHeight: 420,
    cropCenterX: 247,
    cropCenterY: 150,
    cropWidth: 260,
  };
}

function minotaurPortrait(presetId: string): PortraitCrop {
  const match = presetId.match(/(\d+)$/);
  if (!match) {
    throw new Error(`Cannot derive a Minotaur number from preset id "${presetId}"`);
  }
  return {
    src: `/assets/enemies/Minotaur_${match[1]}/PNG/PNG Sequences/Idle/0_Minotaur_Idle_000.png`,
    naturalWidth: 900,
    naturalHeight: 900,
    cropCenterX: 410,
    cropCenterY: 370,
    cropWidth: 420,
  };
}

/** Zooms into one region of a larger sprite, cropped to a square avatar. Flip is applied by the caller, to the wrapper. */
function Portrait({ crop, alt }: { crop: PortraitCrop; alt: string }) {
  const scale = PORTRAIT_SIZE / crop.cropWidth;
  const displayWidth = Math.round(crop.naturalWidth * scale);
  const displayHeight = Math.round(crop.naturalHeight * scale);
  const left = PORTRAIT_SIZE / 2 - crop.cropCenterX * scale;
  const top = PORTRAIT_SIZE / 2 - crop.cropCenterY * scale;

  return (
    <Image
      src={crop.src}
      alt={alt}
      width={displayWidth}
      height={displayHeight}
      className="absolute max-w-none"
      style={{ left, top }}
    />
  );
}

interface ActorHudProps {
  crop: PortraitCrop;
  headAlt: string;
  align: "left" | "right";
  /** Mirrors the portrait so both actors visually face each other, matching the battle stage. */
  flip?: boolean;
  /** Drains this actor's Health meter (combat resolution). */
  defeated?: boolean;
}

/**
 * Below `sm` the meter column sits under the portrait instead of beside it
 * — a row layout at phone widths would sum portrait + meter widths and
 * leave the puzzle panel (pinned between the two `ActorHud` blocks, see
 * `HUD_FOOTPRINT_PX`) too narrow to hold anything. Stacking caps the
 * block's width at whichever of the two is wider.
 */
function ActorHud({ crop, headAlt, align, flip = false, defeated = false }: ActorHudProps) {
  return (
    <div
      className={`liquid-glass encounter-glass animate-blur-fade-up flex flex-col items-center gap-1.5 rounded-xl px-2 py-1.5 sm:flex-row sm:gap-3 sm:px-4 sm:py-3 ${
        align === "right" ? "sm:flex-row-reverse" : ""
      }`}
    >
      <div className="flex flex-col items-center gap-1">
        <div
          className={`relative overflow-hidden rounded-full ring-2 ring-white/25 ${flip ? "scale-x-[-1]" : ""}`}
          style={{ width: PORTRAIT_SIZE, height: PORTRAIT_SIZE }}
        >
          <Portrait crop={crop} alt={headAlt} />
        </div>
        <p className="text-[8px] tracking-[0.18em] text-white/60 uppercase">Lv. 0</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Meter label="Health" tone="bg-emerald-400" depleted={defeated} />
        <Meter label="Mana" tone="bg-cyan-300" />
      </div>
    </div>
  );
}

/**
 * Decorative health/mana HUD for both combatants, pinned to the top corners
 * of the Convocation battle stage — one block per actor (player top-left,
 * Minotaur top-right, mirroring their entrance sides) with a head portrait
 * so it's unambiguous whose bars are whose, and a "Lv. 0" placeholder since
 * no level system exists yet at this point in onboarding. Static full bars
 * only, not wired to any real value — no character stats exist yet either
 * (`CharacterDraft` has no HP or mana; those only exist on `CharacterRecord`,
 * created after class choice).
 *
 * The Minotaur portrait is mirrored so both actors face each other, same as
 * on the battle stage (`ConvocationBattleStage` mirrors the Minotaur sprite
 * there for the same reason).
 *
 * `outcome` drives combat resolution: a "hit" drains the Minotaur's Health
 * meter (the player's cast connected), a "miss"/"fail" drains the Wraith's
 * (mirroring `ConvocationBattleStage`'s hurt/dying sprite reaction — this is
 * the same event, just reflected in the HUD).
 */
export function ConvocationHud({ playerSpritePresetId, enemyPresetId, outcome }: ConvocationHudProps) {
  const playerDefeated = outcome === "miss" || outcome === "fail";
  const enemyDefeated = outcome === "hit";

  return (
    <>
      <div className="fixed top-3 left-3 z-40 sm:top-6 sm:left-6">
        <ActorHud
          crop={wraithPortrait(playerSpritePresetId)}
          headAlt="Your Wraith"
          align="left"
          defeated={playerDefeated}
        />
      </div>
      <div className="fixed top-3 right-3 z-40 sm:top-6 sm:right-6">
        <ActorHud
          crop={minotaurPortrait(enemyPresetId)}
          headAlt="Minotaur"
          align="right"
          flip
          defeated={enemyDefeated}
        />
      </div>
    </>
  );
}
