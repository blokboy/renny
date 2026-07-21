import type { CharacterRecord } from "./types";

/**
 * Character persistence, MVP-scoped: there is no backend/database in this
 * repo yet, so a freshly-created hero is persisted to `localStorage` behind
 * this small typed interface. Swapping in a real backend later is a matter
 * of reimplementing these three functions, not redesigning any caller —
 * `CreationWizard` and the recap page only ever call `saveCharacter` /
 * `getCharacter`.
 */
const STORAGE_KEY = "renny:character";

export function saveCharacter(record: CharacterRecord): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function getCharacter(): CharacterRecord | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CharacterRecord;
  } catch {
    return null;
  }
}

export function clearCharacter(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
