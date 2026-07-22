import { CroppedPortrait, wraithPortraitCrop, type PortraitCrop } from "@/components/assets";
import { CombatHud, COMBAT_HUD_PORTRAIT_SIZE, type CombatMeterSpec } from "@/components/combat";
import type { Outcome } from "@/lib/combat/types";

export interface ConvocationHudProps {
  playerSpritePresetId: string;
  enemyPresetId: string;
  /** The Judge's resolved outcome for the current cast, once known — drains the losing side's Health meter. */
  outcome: Outcome | null;
  /** Fraction (0-1) of the way to level 1 — see the doc comment on `ConvocationHud` below. */
  xpFraction: number;
  /** Exposed so `ConvocationMap` can measure each HUD card's rendered edge for `usePanelInsets`. */
  leftHudRef?: React.Ref<HTMLDivElement>;
  rightHudRef?: React.Ref<HTMLDivElement>;
}

/**
 * The raw rig `Head.png` parts have no face baked in (eyes/mouth are a
 * separate "Face" overlay with rig-specific offsets we don't have data for),
 * so the portrait crops instead zoom into the already fully-composited art:
 * the Wraith's flat preset image (`wraithPortraitCrop`, shared with
 * `GuardianBattle`'s Guardian portrait since it's also a Wraith preset), and
 * the Minotaur's first Idle frame.
 */
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

/**
 * Decorative health/mana HUD for both combatants, pinned to the top corners
 * of the Convocation battle stage — one `CombatHud` card per actor (player
 * top-left, Minotaur top-right, mirroring their entrance sides) with a head
 * portrait so it's unambiguous whose bars are whose, and a "Lv. 0"
 * placeholder since no level system exists yet at this point in onboarding.
 * Static full bars only, not wired to any real value — no character stats
 * exist yet either (`CharacterDraft` has no HP or mana; those only exist on
 * `CharacterRecord`, created after class choice).
 *
 * The Minotaur portrait is mirrored so both actors face each other, same as
 * on the battle stage (`ConvocationBattleStage` mirrors the Minotaur sprite
 * there for the same reason).
 *
 * `outcome` drives combat resolution: a "hit" drains the Minotaur's Health
 * meter (the player's cast connected), a "miss"/"fail" drains the Wraith's
 * (mirroring `ConvocationBattleStage`'s hurt/dying sprite reaction — this is
 * the same event, just reflected in the HUD).
 *
 * `xpFraction` fills the player's third meter — during the Convocation
 * tutorial this is `completedThrough / CONVOCATION_STOPS.length`, so it
 * fills by 1/8 per stop and reaches full (level 1) exactly when the last
 * tutorial stop is done, right before the boss battle. The Minotaur's third
 * meter is a static full bar, same treatment as its Health/Mana — the
 * player's `CombatHud` is the standard layout every combatant's HUD follows,
 * not a special case.
 */
export function ConvocationHud({
  playerSpritePresetId,
  enemyPresetId,
  outcome,
  xpFraction,
  leftHudRef,
  rightHudRef,
}: ConvocationHudProps) {
  const playerDefeated = outcome === "miss" || outcome === "fail";
  const enemyDefeated = outcome === "hit";

  const playerMeters: CombatMeterSpec[] = [
    { label: "Health", tone: "bg-emerald-400", fraction: 1, depleted: playerDefeated },
    { label: "Mana", tone: "bg-cyan-300", fraction: 1 },
    { label: "XP", tone: "bg-amber-300", fraction: xpFraction },
  ];
  const enemyMeters: CombatMeterSpec[] = [
    { label: "Health", tone: "bg-emerald-400", fraction: 1, depleted: enemyDefeated },
    { label: "Mana", tone: "bg-cyan-300", fraction: 1 },
    { label: "XP", tone: "bg-amber-300", fraction: 1 },
  ];

  return (
    <>
      <div className="fixed top-3 left-3 z-30 sm:top-6 sm:left-6">
        <CombatHud
          hudRef={leftHudRef}
          portrait={
            <CroppedPortrait
              crop={wraithPortraitCrop(playerSpritePresetId)}
              alt="Your Wraith"
              size={COMBAT_HUD_PORTRAIT_SIZE}
            />
          }
          caption="Lv. 0"
          align="left"
          meters={playerMeters}
        />
      </div>
      <div className="fixed top-3 right-3 z-30 sm:top-6 sm:right-6">
        <CombatHud
          hudRef={rightHudRef}
          portrait={
            <CroppedPortrait
              crop={minotaurPortrait(enemyPresetId)}
              alt="Minotaur"
              size={COMBAT_HUD_PORTRAIT_SIZE}
            />
          }
          caption="Lv. 0"
          align="right"
          flip
          meters={enemyMeters}
        />
      </div>
    </>
  );
}
