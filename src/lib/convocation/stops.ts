/**
 * The Convocation's 8 fixed stops (prompt-quest-design-doc.md §3.1). Puzzle
 * content per stop isn't specified anywhere yet (that's #10's job) — this is
 * only the map layer: where each stop's marker sits on the shrine path and
 * whether it's reachable.
 *
 * Position percentages are hand-picked against
 * `public/assets/backgrounds/tutorial-zone/*.png`'s zigzag path and are
 * approximate — nudge them if they drift off the platforms.
 */
export interface ConvocationStop {
  id: number;
  label: string;
  /** Percent-based position within the scene container, top-left origin. */
  position: { xPercent: number; yPercent: number };
}

export const CONVOCATION_STOPS: ConvocationStop[] = [
  { id: 1, label: "Stop 1", position: { xPercent: 45, yPercent: 92 } },
  { id: 2, label: "Stop 2", position: { xPercent: 60, yPercent: 81 } },
  { id: 3, label: "Stop 3", position: { xPercent: 48, yPercent: 70 } },
  { id: 4, label: "Stop 4", position: { xPercent: 63, yPercent: 59 } },
  { id: 5, label: "Stop 5", position: { xPercent: 51, yPercent: 48 } },
  { id: 6, label: "Stop 6", position: { xPercent: 61, yPercent: 35 } },
  { id: 7, label: "Stop 7", position: { xPercent: 49, yPercent: 24 } },
  { id: 8, label: "Stop 8 — Final Trial", position: { xPercent: 60, yPercent: 12 } },
];
