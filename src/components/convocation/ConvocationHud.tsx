interface MeterProps {
  label: string;
  tone: string;
}

function Meter({ label, tone }: MeterProps) {
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-[9px] tracking-[0.18em] text-white/70 uppercase">{label}</p>
      <div className="h-2.5 overflow-hidden rounded-full bg-black/50">
        <div className={`h-full w-full rounded-full ${tone}`} />
      </div>
    </div>
  );
}

/**
 * Decorative health/mana HUD pinned to the bottom of the Convocation battle
 * stage. Static full bars only, not wired to any real value — no character
 * stats exist yet at this point in onboarding (`CharacterDraft` has no HP or
 * mana; those only exist on `CharacterRecord`, created after class choice).
 */
export function ConvocationHud() {
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 sm:inset-x-6 sm:bottom-6">
      <div className="liquid-glass encounter-glass animate-blur-fade-up flex gap-4 rounded-xl px-4 py-3 sm:px-6">
        <Meter label="Health" tone="bg-emerald-400" />
        <Meter label="Mana" tone="bg-cyan-300" />
      </div>
    </div>
  );
}
