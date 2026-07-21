const STORAGE_KEY = "convocation-progress";

export interface ConvocationProgress {
  /** Highest stop id the player has completed. 0 = none completed yet. */
  completedThrough: number;
  /** XP banked by the fixed Convocation encounters before class selection exists. */
  totalXp: number;
  xpByStop: Record<number, number>;
}

const INITIAL_PROGRESS: ConvocationProgress = { completedThrough: 0, totalXp: 0, xpByStop: {} };

// Cached by raw string so `getSnapshot` returns a stable reference when
// storage hasn't actually changed, as useSyncExternalStore requires.
let lastRaw: string | null = null;
let cachedSnapshot: ConvocationProgress = INITIAL_PROGRESS;

function readSnapshot(): ConvocationProgress {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === lastRaw) return cachedSnapshot;

  lastRaw = raw;
  if (!raw) {
    cachedSnapshot = INITIAL_PROGRESS;
    return cachedSnapshot;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ConvocationProgress>;
    cachedSnapshot = {
      completedThrough: parsed.completedThrough ?? 0,
      totalXp: parsed.totalXp ?? 0,
      xpByStop: parsed.xpByStop ?? {},
    };
  } catch {
    cachedSnapshot = INITIAL_PROGRESS;
  }
  return cachedSnapshot;
}

function writeSnapshot(next: ConvocationProgress) {
  const raw = JSON.stringify(next);
  window.localStorage.setItem(STORAGE_KEY, raw);
  lastRaw = raw;
  cachedSnapshot = next;
  for (const listener of listeners) listener();
}

const listeners = new Set<() => void>();

/** For useSyncExternalStore: subscribes to both same-tab writes and cross-tab storage events. */
export function subscribeToConvocationProgress(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function getConvocationProgressSnapshot(): ConvocationProgress {
  return readSnapshot();
}

export function getConvocationProgressServerSnapshot(): ConvocationProgress {
  return INITIAL_PROGRESS;
}

export function completeStop(stopId: number, xpGained = 0): ConvocationProgress {
  const current = readSnapshot();
  const wasAlreadyComplete = stopId <= current.completedThrough;
  const nextXpByStop = { ...current.xpByStop };
  if (!wasAlreadyComplete) {
    nextXpByStop[stopId] = xpGained;
  }
  const next: ConvocationProgress = {
    completedThrough: Math.max(current.completedThrough, stopId),
    totalXp: wasAlreadyComplete ? current.totalXp : current.totalXp + xpGained,
    xpByStop: nextXpByStop,
  };
  writeSnapshot(next);
  return next;
}

export function resetConvocationProgress(): ConvocationProgress {
  writeSnapshot(INITIAL_PROGRESS);
  return INITIAL_PROGRESS;
}
