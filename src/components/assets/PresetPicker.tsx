import Image from "next/image";
import type { SpritePreset } from "@/lib/assets";

export interface PresetPickerProps {
  label: string;
  presets: SpritePreset[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * Labeled thumbnail-button picker for whole-character sprite presets.
 * The parent owns selection state; this component only ever needs to live
 * inside an existing client boundary.
 */
export function PresetPicker({ label, presets, selectedId, onSelect }: PresetPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-zinc-300">{label}</legend>
      <div className="flex flex-wrap gap-3">
        {presets.map((preset) => {
          const isSelected = preset.id === selectedId;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(preset.id)}
              className={`flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition ${
                isSelected
                  ? "border-white bg-white/10 text-white"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              <Image src={preset.imageSrc} alt={preset.label} width={64} height={64} className="h-16 w-16 object-contain" />
              {preset.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
