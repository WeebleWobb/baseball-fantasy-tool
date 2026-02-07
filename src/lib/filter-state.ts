import type { PlayerFilterType } from "@/types/hooks"

const STORAGE_KEY = 'baseball-fantasy-tool:playerFilter'
const DEFAULT_FILTER: PlayerFilterType = 'ALL_BATTERS'

// Valid filter values for validation
const VALID_FILTERS: PlayerFilterType[] = [
  'ALL_BATTERS', 'ALL_PITCHERS', 'C', '1B', '2B', 'SS', '3B', 'OF', 'Util', 'SP', 'RP'
]

/**
 * Validate and retrieve stored filter from localStorage
 * @returns The stored filter or default filter if invalid/not found
 */
export function getStoredFilter(): PlayerFilterType {
  if (globalThis.window === undefined) {
    return DEFAULT_FILTER
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return VALID_FILTERS.includes(stored as PlayerFilterType)
      ? (stored as PlayerFilterType)
      : DEFAULT_FILTER
  } catch {
    return DEFAULT_FILTER
  }
}

/**
 * Save filter to localStorage with error handling
 * @param filter - The filter to save
 */
export function saveFilter(filter: PlayerFilterType): void {
  if (globalThis.window === undefined) {
    return
  }
  try {
    if (!VALID_FILTERS.includes(filter)) {
      filter = DEFAULT_FILTER
    }
    localStorage.setItem(STORAGE_KEY, filter)
  } catch {
    // localStorage unavailable
  }
}

/**
 * Clear stored filter and reset to default
 */
export function clearStoredFilter(): void {
  if (globalThis.window === undefined) {
    return
  }
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage unavailable
  }
}

/**
 * Hook-like function to manage filter state with localStorage persistence
 * @param initialFilter - Optional initial filter (defaults to stored or ALL_BATTERS)
 * @returns Object with current filter and update function
 */
export function createFilterState(initialFilter?: PlayerFilterType) {
  const currentFilter = initialFilter || getStoredFilter()
  
  const updateFilter = (newFilter: PlayerFilterType) => {
    saveFilter(newFilter)
    return newFilter
  }
  
  return {
    currentFilter,
    updateFilter
  }
} 