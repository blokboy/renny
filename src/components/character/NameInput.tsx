export const NAME_MAX_LENGTH = 10;

export interface NameInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Hero name entry: a single field the player clicks into and types
 * directly, capped at `NAME_MAX_LENGTH` characters and uppercased to match
 * the retro character-creation framing.
 */
export function NameInput({ value, onChange }: NameInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium tracking-wide text-zinc-400 uppercase">Hero name</span>
      <input
        type="text"
        value={value}
        maxLength={NAME_MAX_LENGTH}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        placeholder="ENTER NAME"
        className="w-full max-w-xs rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-lg tracking-widest text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
        aria-label={`Hero name, up to ${NAME_MAX_LENGTH} characters`}
      />
    </div>
  );
}
