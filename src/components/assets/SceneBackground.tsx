import Image from "next/image";
import type { ReactNode } from "react";
import type { BackgroundScene } from "@/lib/assets";

export interface SceneBackgroundProps {
  scene: BackgroundScene;
  /** Must give the container a real size (e.g. an aspect-ratio + width) since layers use `fill`. */
  className?: string;
  children?: ReactNode;
}

/**
 * Renders a scene's background layers back-to-front, in the shared
 * sky -> ground -> decoration order. Each layer supplies either a real
 * image (`src`) or a flat `color` fallback — this is the one component the
 * Convocation and the Town Hub should both render scenes through, so a
 * future change to how layers are composited (e.g. real parallax) only
 * needs to happen here.
 */
export function SceneBackground({ scene, className, children }: SceneBackgroundProps) {
  return (
    <div className={`relative overflow-hidden ${className ?? "aspect-video w-full"}`}>
      {scene.layers.map((layer) => (
        <div key={layer.id} className="absolute inset-0" data-layer-kind={layer.kind}>
          {layer.src ? (
            <Image
              src={layer.src}
              alt={`${scene.label} - ${layer.kind} layer`}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority={layer.kind === "sky"}
            />
          ) : (
            <div className="h-full w-full" style={{ backgroundColor: layer.color ?? "transparent" }} />
          )}
        </div>
      ))}
      {children ? <div className="relative h-full w-full">{children}</div> : null}
    </div>
  );
}
