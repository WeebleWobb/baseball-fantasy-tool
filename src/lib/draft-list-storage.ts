import type { StoredDraftPlayer, DraftListState } from '@/types/draft-list';

const STORAGE_KEY = 'baseball-fantasy-tool:draftList';
const CURRENT_VERSION = 1;

/**
 * Retrieve stored draft list from localStorage
 */
export function getStoredDraftList(): StoredDraftPlayer[] {
  if (globalThis.window === undefined) {
    return [];
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed: DraftListState = JSON.parse(stored);
    if (parsed.version !== CURRENT_VERSION) {
      // Handle version migration if needed in the future
      return [];
    }
    return Array.isArray(parsed.players) ? parsed.players : [];
  } catch {
    return [];
  }
}

/**
 * Save draft list to localStorage
 */
export function saveDraftList(players: StoredDraftPlayer[]): void {
  if (globalThis.window === undefined) {
    return;
  }
  try {
    const state: DraftListState = {
      players,
      version: CURRENT_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

/**
 * Clear draft list from localStorage
 */
export function clearDraftList(): void {
  if (globalThis.window === undefined) {
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}
