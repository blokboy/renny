import type { SpriteVariant } from "@/lib/assets";

export interface VariantPickerProps {
  label: string;
  variants: SpriteVariant[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * Generic labeled-button picker for sprite layer variants (body/head/hair
 * style). The parent owns selection state; this component only ever needs
 * to live inside an existing client boundary.
 */
export function VariantPicker({ label, variants, selectedId, onSelect }: VariantPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-zinc-300">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedId;
          return (
            <button
              key={variant.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(variant.id)}
              className={`rounded-md border px-3 py-1 text-sm transition ${
                isSelected
                  ? "border-white bg-white/10 text-white"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {variant.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
