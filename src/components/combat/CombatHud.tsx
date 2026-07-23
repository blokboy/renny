/** Rendered width/height of a `CombatHud` portrait circle, in pixels. */
export const COMBAT_HUD_PORTRAIT_SIZE = 48;

export interface CombatMeterSpec {
  label: string;
  /** Fill color, e.g. `"bg-emerald-400"`. */
  tone: string;
  /** Fraction (0-1) of the bar to fill. Ignored when `depleted` is set. */
  fraction: number;
  /** Drains the bar to empty (combat resolution) instead of showing `fraction`. */
  depleted?: boolean;
  /** Renders a `value/max` readout beside the label. */
  showValue?: boolean;
  value?: number;
  max?: number;
  /** Renders above this meter's label — for a state tied to this actor (e.g. a shield status), not the puzzle. */
  badge?: React.ReactNode;
}

function Meter({ label, tone, fraction, depleted = false, showValue = false, value, max, badge }: CombatMeterSpec) {
  const widthPercent = depleted ? 0 : Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <div className="relative min-w-16 sm:min-w-36">
      {badge && <div className="absolute bottom-full left-0 mb-1">{badge}</div>}
      <div className="mb-0.5 flex items-baseline justify-between gap-2">
        <p className="text-[8px] tracking-[0.18em] text-white/70 uppercase">{label}</p>
        {showValue && (
          <span className="font-mono text-[9px] text-white/50">
            {value}/{max}
          </span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/50">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-in ${tone}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}

export interface CombatHudProps {
  /** Already-sized portrait element (`CroppedPortrait` or `PoseSprite`) — sprite-type selection stays the caller's job. */
  portrait: React.ReactNode;
  /** Text under the portrait: a level, a name, or a role label. */
  caption: string;
  /** Controls which side the portrait sits on at `sm` and up (`sm:flex-row-reverse`). */
  align: "left" | "right";
  /** Mirrors the portrait so both actors face each other. */
  flip?: boolean;
  meters: CombatMeterSpec[];
  /** Exposed so a parent can measure this card's rendered edge (see `usePanelInsets`). */
  hudRef?: React.Ref<HTMLDivElement>;
}

/**
 * Shared actor HUD card — portrait, caption, and a meter column — used by
 * every combat screen. Position (`fixed` to the viewport vs. `absolute`
 * within a battle stage) and z-index stay the caller's job since screens
 * differ in surrounding layout; this component only owns the card itself.
 */
export function CombatHud({ portrait, caption, align, flip = false, meters, hudRef }: CombatHudProps) {
  return (
    <div
      ref={hudRef}
      className={`liquid-glass encounter-glass animate-blur-fade-up flex flex-col items-center gap-1.5 rounded-xl px-2 py-1.5 sm:flex-row sm:gap-3 sm:px-4 sm:py-3 ${
        align === "right" ? "sm:flex-row-reverse" : ""
      }`}
    >
      <div className="flex flex-col items-center gap-1">
        <div
          className={`relative overflow-hidden rounded-full ring-2 ring-white/25 ${flip ? "scale-x-[-1]" : ""}`}
          style={{ width: COMBAT_HUD_PORTRAIT_SIZE, height: COMBAT_HUD_PORTRAIT_SIZE }}
        >
          {portrait}
        </div>
        <p className="text-[8px] tracking-[0.18em] text-white/60 uppercase">{caption}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        {meters.map((meter) => (
          <Meter key={meter.label} {...meter} />
        ))}
      </div>
    </div>
  );
}
