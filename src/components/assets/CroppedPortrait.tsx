import Image from "next/image";

export interface PortraitCrop {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  /** Center of the desired crop (face/eyes), in the source image's native pixels. */
  cropCenterX: number;
  cropCenterY: number;
  /** Width of the crop box, in native pixels — the portrait is scaled so this fills `size`. */
  cropWidth: number;
}

export interface CroppedPortraitProps {
  crop: PortraitCrop;
  alt: string;
  /** Rendered width and height, in pixels — the crop is always square. */
  size: number;
}

/** Zooms into one region of a larger sprite, cropped to a square avatar of `size` px. Flip/mirroring and the `size`x`size` clipping box are the caller's job (wrap this in a fixed-size `overflow-hidden` container). */
export function CroppedPortrait({ crop, alt, size }: CroppedPortraitProps) {
  const scale = size / crop.cropWidth;
  const displayWidth = Math.round(crop.naturalWidth * scale);
  const displayHeight = Math.round(crop.naturalHeight * scale);
  const left = size / 2 - crop.cropCenterX * scale;
  const top = size / 2 - crop.cropCenterY * scale;

  return (
    <Image
      src={crop.src}
      alt={alt}
      width={displayWidth}
      height={displayHeight}
      className="absolute max-w-none"
      style={{ left, top }}
    />
  );
}

/**
 * The raw rig `Head.png` parts have no face baked in (eyes/mouth are a
 * separate "Face" overlay with rig-specific offsets we don't have data for),
 * so this crops into the already fully-composited flat preset image instead
 * — the same art `PoseSprite`'s `pose="idle"` renders, just square-cropped
 * for use as a small HUD avatar (a Wraith preset's native 520x420 aspect
 * ratio would otherwise stretch a `rounded-full` frame into an oval).
 */
export function wraithPortraitCrop(presetId: string): PortraitCrop {
  const match = presetId.match(/(\d+)$/);
  if (!match) {
    throw new Error(`Cannot derive a Wraith number from preset id "${presetId}"`);
  }
  const n = match[1].padStart(2, "0");
  return {
    src: `/assets/character_creation/presets/wraith-${n}.png`,
    naturalWidth: 520,
    naturalHeight: 420,
    cropCenterX: 247,
    cropCenterY: 150,
    cropWidth: 260,
  };
}
