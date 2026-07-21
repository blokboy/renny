import { Check, LockKeyhole, Play } from "lucide-react";
import type { ConvocationStop } from "@/lib/convocation/stops";

export type TrialCardState = "completed" | "current" | "locked";

interface ConvocationTrialCardProps {
  stop: ConvocationStop;
  state: TrialCardState;
  onEnter: () => void;
}

const STATE_LABELS: Record<TrialCardState, string> = {
  completed: "Complete",
  current: "Available",
  locked: "Locked",
};

export function ConvocationTrialCard({ stop, state, onEnter }: ConvocationTrialCardProps) {
  const isCurrent = state === "current";

  return (
    <button
      type="button"
      disabled={!isCurrent}
      onClick={onEnter}
      data-state={state}
      aria-label={`${stop.puzzle.title}: ${STATE_LABELS[state]}`}
      className={`liquid-glass trial-card-glass group flex h-full min-h-56 w-full flex-col rounded-xl p-4 text-left transition sm:min-h-72 sm:w-52 sm:p-5 lg:w-56 ${
        state === "completed"
          ? "text-emerald-50"
          : isCurrent
            ? "text-white hover:-translate-y-1"
            : "cursor-not-allowed text-zinc-400 opacity-60"
      }`}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm ${
            state === "completed"
              ? "border-emerald-300/60 bg-emerald-300/15 text-emerald-100"
              : isCurrent
                ? "border-white/50 bg-white/10 text-white"
                : "border-white/15 bg-white/5 text-zinc-600"
          }`}
        >
          {state === "completed" ? (
            <Check size={17} aria-hidden="true" />
          ) : state === "locked" ? (
            <LockKeyhole size={15} aria-hidden="true" />
          ) : (
            String(stop.id).padStart(2, "0")
          )}
        </span>
        <span className="text-[9px] tracking-[0.18em] uppercase">{STATE_LABELS[state]}</span>
      </div>

      <div className="mt-5">
        <p className="text-[9px] tracking-[0.2em] text-current/60 uppercase">
          Trial {String(stop.id).padStart(2, "0")}
        </p>
        <h2 className="font-grape-soda mt-2 text-3xl leading-none text-current">
          {stop.puzzle.title}
        </h2>
        <p className="mt-3 line-clamp-4 text-[10px] leading-5 text-current/70 sm:line-clamp-6">
          {stop.hint}
        </p>
      </div>

      <span
        className={`mt-auto flex items-center gap-2 pt-5 text-[9px] tracking-[0.16em] uppercase ${
          isCurrent ? "text-white/85 group-hover:text-black" : "text-current/60"
        }`}
      >
        {isCurrent && <Play size={11} fill="currentColor" aria-hidden="true" />}
        {state === "completed" ? "Trial passed" : isCurrent ? "Enter trial" : "Complete prior trial"}
      </span>
    </button>
  );
}
