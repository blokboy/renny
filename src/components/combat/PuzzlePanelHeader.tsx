export interface PuzzlePanelProps {
  titleId: string;
  /** Sizing overrides (`max-h-*`, `max-w-*`) — panels genuinely differ in how much content they hold. */
  className?: string;
  children: React.ReactNode;
}

/** Shared puzzle-panel chrome: glass card, rounded corners, dialog semantics, header/body grid. */
export function PuzzlePanel({ titleId, className = "", children }: PuzzlePanelProps) {
  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={`liquid-glass encounter-glass animate-blur-fade-up grid grid-rows-[auto_1fr] overflow-hidden rounded-xl font-mono text-sm text-white ${className}`}
    >
      {children}
    </section>
  );
}

export interface PuzzlePanelHeaderProps {
  titleId: string;
  /** e.g. Guardian's "Turn N · Phase" — shown above the title. */
  eyebrow?: string;
  title: string;
  /** Renders the pill Exit button only when provided — not every combat screen has a "leave early" action. */
  onClose?: () => void;
  closeDisabled?: boolean;
  /** The family/preview/status pill row — compose `Pill` elements here. */
  pills?: React.ReactNode;
  hint?: string;
}

/** Shared puzzle-panel header: title row, optional Exit button, and a full-bleed pill strip. */
export function PuzzlePanelHeader({
  titleId,
  eyebrow,
  title,
  onClose,
  closeDisabled,
  pills,
  hint,
}: PuzzlePanelHeaderProps) {
  return (
    <header className="border-b border-white/15 px-3 py-2 sm:px-4 sm:py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          {eyebrow && <p className="text-xs text-emerald-300 uppercase">{eyebrow}</p>}
          <h2 id={titleId} className="text-sm font-bold sm:text-lg">
            {title}
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className="shrink-0 rounded-full border border-white/20 px-2.5 py-0.5 text-[9px] tracking-wide uppercase hover:bg-white/10 disabled:opacity-40"
          >
            Exit
          </button>
        )}
      </div>
      {pills && (
        <div className="mx-[-0.75rem] mt-2 flex w-[calc(100%+1.5rem)] items-center gap-1.5 overflow-x-auto border-y border-white/10 bg-black/15 px-3 py-1.5 sm:mx-[-1rem] sm:w-[calc(100%+2rem)] sm:gap-2 sm:px-4">
          {pills}
        </div>
      )}
      {hint && <p className="mt-1 text-xs text-white/55">{hint}</p>}
    </header>
  );
}
