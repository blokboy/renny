import {
  CLASSES,
  STARTING_STATS,
  formatSpellCost,
  getStartingHp,
  getStartingMana,
} from "@/lib/character";
import { StatBar } from "./StatBar";

export interface ClassPickerProps {
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

/**
 * Paged class picker: prev/next through all 7 classes, showing the selected
 * class's tagline, 5 stat bars, bound familiar, Ward, and full Lv1-100 spell
 * list with cost + description — per issue #3's acceptance criteria.
 */
export function ClassPicker({ selectedIndex, onSelectIndex }: ClassPickerProps) {
  const classDef = CLASSES[selectedIndex];
  const stats = STARTING_STATS[classDef.id];
  const maxMana = getStartingMana(stats);
  const maxHp = getStartingHp(stats);

  function goTo(index: number) {
    onSelectIndex((index + CLASSES.length) % CLASSES.length);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => goTo(selectedIndex - 1)}
          className="rounded border border-zinc-700 px-3 py-1 text-sm text-zinc-200 transition hover:border-emerald-500 hover:text-white"
          aria-label="Previous class"
        >
          ← Prev
        </button>
        <div className="flex gap-1">
          {CLASSES.map((c, index) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectIndex(index)}
              aria-label={c.name}
              aria-current={index === selectedIndex}
              className={`h-2 w-2 rounded-full transition ${
                index === selectedIndex ? "bg-emerald-500" : "bg-zinc-700"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => goTo(selectedIndex + 1)}
          className="rounded border border-zinc-700 px-3 py-1 text-sm text-zinc-200 transition hover:border-emerald-500 hover:text-white"
          aria-label="Next class"
        >
          Next →
        </button>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
          Class {selectedIndex + 1} of {CLASSES.length}
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white">{classDef.name}</h2>
        <p className="mt-1 text-sm text-emerald-400">{classDef.tagline}</p>
        <p className="mt-3 text-sm text-zinc-400">
          <span className="font-medium text-zinc-300">Bound familiar:</span> {classDef.familiar}
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Stats</p>
          <StatBar label="STR" value={stats.str} />
          <StatBar label="INT" value={stats.int} />
          <StatBar label="WIS" value={stats.wis} />
          <StatBar label="SPD" value={stats.spd} />
          <StatBar label="LCK" value={stats.lck} />
          <p className="mt-1 text-xs text-zinc-600">
            Starting HP {maxHp} · Starting mana {maxMana}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            Ward — {classDef.ward.name}
          </p>
          <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-white">{classDef.ward.name}</span>
              <span className="text-xs text-zinc-500">
                {formatSpellCost(maxMana, classDef.ward.cost)}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">{classDef.ward.description}</p>
            <p className="mt-1 text-[11px] text-zinc-600">Counters prompt injection.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            Spell list
          </p>
          <ul className="flex flex-col gap-2">
            {classDef.spells.map((spell) => (
              <li key={spell.level} className="rounded border border-zinc-800 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-white">
                    Lv {spell.level} — {spell.name}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatSpellCost(maxMana, spell.cost)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{spell.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
