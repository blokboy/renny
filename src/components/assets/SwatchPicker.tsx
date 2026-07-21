import type { Swatch } from "@/lib/assets";

export interface SwatchPickerProps {
  label: string;
  swatches: Swatch[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * Generic color-swatch picker (skin tone, hair color, ...). Renders one
 * circular button per swatch; the parent owns selection state, so this
 * component only ever needs to live inside an existing client boundary.
 */
export function SwatchPicker({ label, swatches, selectedId, onSelect }: SwatchPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-zinc-300">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {swatches.map((swatch) => {
          const isSelected = swatch.id === selectedId;
          return (
            <button
              key={swatch.id}
              type="button"
              aria-label={swatch.label}
              aria-pressed={isSelected}
              title={swatch.label}
              onClick={() => onSelect(swatch.id)}
              className={`h-8 w-8 rounded-full border-2 transition ${
                isSelected ? "scale-110 border-white" : "border-transparent"
              }`}
              style={{ backgroundColor: swatch.hex }}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
