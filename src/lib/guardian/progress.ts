const STORAGE_KEY = "renny:threshold-guardian-complete";

export function markGuardianComplete(encounterId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ encounterId, completedAt: new Date().toISOString() }),
  );
}

export function isGuardianComplete(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) !== null;
}
