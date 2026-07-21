export interface StatBarProps {
  label: string;
  value: number;
  /** Upper bound the bar fills against. Defaults to 20 (see starting-stats.ts). */
  max?: number;
}

/** A single labeled stat bar (STR/INT/WIS/SPD/LCK) for the class picker. */
export function StatBar({ label, value, max = 20 }: StatBarProps) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 shrink-0 text-xs font-medium tracking-wide text-zinc-400 uppercase">
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-6 shrink-0 text-right text-xs text-zinc-500">{value}</span>
    </div>
  );
}
