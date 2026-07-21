import {
  BODY_VARIANTS,
  HAIR_COLORS,
  HAIR_VARIANTS,
  HEAD_VARIANTS,
  SKIN_TONES,
  getSwatch,
} from "@/lib/assets";
import type { CharacterSpriteConfig, ShapeSpec, SpriteVariant } from "@/lib/assets";

function getVariant(variants: SpriteVariant[], id: string): SpriteVariant {
  const found = variants.find((variant) => variant.id === id);
  if (!found) {
    throw new Error(`Unknown sprite variant id: "${id}"`);
  }
  return found;
}

function Shape({ shape, fill }: { shape: ShapeSpec; fill: string }) {
  switch (shape.kind) {
    case "rect":
      return (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          rx={shape.rx ?? 0}
          fill={fill}
        />
      );
    case "circle":
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} fill={fill} />;
    case "ellipse":
      return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} fill={fill} />;
    case "polygon":
      return <polygon points={shape.points} fill={fill} />;
    default:
      return null;
  }
}

export interface CharacterSpriteProps {
  config: CharacterSpriteConfig;
  /** Rendered size in pixels (square). Defaults to 128. */
  size?: number;
  className?: string;
}

/**
 * Renders a composed character sprite (body -> head -> hair, back to front)
 * from a `CharacterSpriteConfig`. This is the single public rendering
 * surface for Renny character sprites — Character Creation, the Convocation,
 * and the Town Hub should all render sprites through this component rather
 * than reimplementing layer composition.
 *
 * See docs/adr/0001-shared-asset-system.md for the full contract.
 */
export function CharacterSprite({ config, size = 128, className }: CharacterSpriteProps) {
  const body = getVariant(BODY_VARIANTS, config.bodyVariantId);
  const head = getVariant(HEAD_VARIANTS, config.headVariantId);
  const hair = getVariant(HAIR_VARIANTS, config.hairVariantId);
  const skin = getSwatch(SKIN_TONES, config.skinToneId);
  const hairColor = getSwatch(HAIR_COLORS, config.hairColorId);

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Composed character sprite"
      style={{ imageRendering: "pixelated" }}
    >
      {body.shapes.map((shape, index) => (
        <Shape key={`body-${index}`} shape={shape} fill={skin.hex} />
      ))}
      {head.shapes.map((shape, index) => (
        <Shape key={`head-${index}`} shape={shape} fill={skin.hex} />
      ))}
      {hair.shapes.map((shape, index) => (
        <Shape key={`hair-${index}`} shape={shape} fill={hairColor.hex} />
      ))}
    </svg>
  );
}
