export const NAME_MAX_LENGTH = 10;

const GRID_ROWS: string[][] = [
  ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"],
  ["N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
  ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "'", " "],
];

export interface NameEntryGridProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Classic JRPG-style on-screen letter grid for naming a new hero, capped at
 * `NAME_MAX_LENGTH` characters. Click-driven (grid buttons) rather than a
 * plain text input, to match the retro character-creation framing the issue
 * asks for; a plain keyboard `<input>` is layered underneath for
 * accessibility/convenience without replacing the grid as the primary UI.
 */
export function NameEntryGrid({ value, onChange }: NameEntryGridProps) {
  const atMax = value.length >= NAME_MAX_LENGTH;

  function appendChar(char: string) {
    if (atMax) return;
    onChange(value + char);
  }

  function backspace() {
    onChange(value.slice(0, -1));
  }

  const cells = Array.from({ length: NAME_MAX_LENGTH }, (_, index) => value[index] ?? "");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
          Hero name
        </span>
        <div
          className="flex gap-1 rounded-md border border-zinc-700 bg-zinc-900 p-3 font-mono text-lg"
          aria-label={`Name entry, ${value.length} of ${NAME_MAX_LENGTH} characters`}
        >
          {cells.map((char, index) => (
            <span
              key={index}
              className={`flex h-8 w-6 items-center justify-center border-b-2 ${
                index === value.length ? "border-emerald-500" : "border-zinc-700"
              } text-white`}
            >
              {char === " " ? " " : char}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1" role="group" aria-label="Letter grid">
        {GRID_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap gap-1">
            {row.map((char) => (
              <button
                key={char}
                type="button"
                disabled={atMax}
                onClick={() => appendChar(char)}
                className="flex h-8 w-8 items-center justify-center rounded border border-zinc-700 font-mono text-sm text-zinc-200 transition hover:border-emerald-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                {char === " " ? "␣" : char}
              </button>
            ))}
          </div>
        ))}
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={backspace}
            disabled={value.length === 0}
            className="rounded border border-zinc-700 px-3 py-1 text-sm text-zinc-200 transition hover:border-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            DEL
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={value.length === 0}
            className="rounded border border-zinc-700 px-3 py-1 text-sm text-zinc-200 transition hover:border-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            CLEAR
          </button>
        </div>
      </div>

      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        Or type it directly:
        <input
          type="text"
          value={value}
          maxLength={NAME_MAX_LENGTH}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-sm text-white"
          aria-label="Hero name (keyboard entry)"
        />
      </label>
    </div>
  );
}
