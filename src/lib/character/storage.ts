import type { CharacterDraft, CharacterRecord } from "./types";

/**
 * Character persistence, MVP-scoped: there is no backend/database in this
 * repo yet, so state is persisted to `localStorage` behind small typed
 * interfaces. Swapping in a real backend later is a matter of
 * reimplementing these functions, not redesigning any caller.
 *
 * Two separate keys/shapes because they're written at two different points
 * in the funnel: the draft (name + appearance) is written at the end of
 * Character Creation; the full record (draft + class) is written later,
 * just before the Threshold Guardian, once class selection is reintroduced.
 */
const DRAFT_STORAGE_KEY = "renny:character-draft";
const STORAGE_KEY = "renny:character";

export function saveCharacterDraft(draft: CharacterDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function getCharacterDraft(): CharacterDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CharacterDraft;
  } catch {
    return null;
  }
}

export function clearCharacterDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_STORAGE_KEY);
}

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
