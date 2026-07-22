"use client";

import { useLayoutEffect, useState, type DependencyList, type RefObject } from "react";

export interface PanelInsets {
  left: number;
  right: number;
}

/**
 * Keeps a puzzle panel pinned `gapPx` from each HUD card's actual rendered
 * edge — measured live via `ResizeObserver` rather than guessed from a
 * hardcoded footprint constant, so it stays correct across breakpoints and
 * content-driven width changes (e.g. a longer character name).
 */
export function usePanelInsets(
  containerRef: RefObject<HTMLElement | null>,
  leftHudRef: RefObject<HTMLDivElement | null>,
  rightHudRef: RefObject<HTMLDivElement | null>,
  gapPx: number,
  deps: DependencyList,
): PanelInsets {
  const [insets, setInsets] = useState<PanelInsets>({ left: 0, right: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    const leftHud = leftHudRef.current;
    const rightHud = rightHudRef.current;
    if (!container || !leftHud || !rightHud) return;

    function measure() {
      const containerRect = container!.getBoundingClientRect();
      const leftRect = leftHud!.getBoundingClientRect();
      const rightRect = rightHud!.getBoundingClientRect();
      setInsets({
        left: leftRect.right - containerRect.left + gapPx,
        right: containerRect.right - rightRect.left + gapPx,
      });
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(leftHud);
    observer.observe(rightHud);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` is caller-supplied; this hook forwards it verbatim.
  }, deps);

  return insets;
}
