import type { SeasonType, TimePeriodType, StatType } from "@/types/hooks"

const SEASON_STORAGE_KEY = 'baseball-fantasy-tool:seasonFilter'
const PERIOD_STORAGE_KEY = 'baseball-fantasy-tool:timePeriodFilter'

const DEFAULT_SEASON: SeasonType = 'current'
const DEFAULT_PERIOD: TimePeriodType = 'full'

const VALID_SEASONS: SeasonType[] = ['current', 'last']
const VALID_PERIODS: TimePeriodType[] = ['full', 'lastmonth', 'lastweek']

/**
 * Derive the Yahoo API stat_type parameter from UI state
 * Note: 'last' season uses a different game key, not a stat type param
 */
export function deriveStatType(season: SeasonType, period: TimePeriodType): StatType {
  // For last season, we still use 'season' stat type but query previous year's game key
  if (season === 'last') return 'season'
  // season === 'current'
  if (period === 'lastmonth') return 'lastmonth'
  if (period === 'lastweek') return 'lastweek'
  return 'season'
}

/**
 * Validate and retrieve stored season from localStorage
 */
export function getStoredSeason(): SeasonType {
  if (globalThis.window === undefined) {
    return DEFAULT_SEASON
  }
  try {
    const stored = localStorage.getItem(SEASON_STORAGE_KEY)
    return VALID_SEASONS.includes(stored as SeasonType)
      ? (stored as SeasonType)
      : DEFAULT_SEASON
  } catch {
    return DEFAULT_SEASON
  }
}

/**
 * Save season to localStorage with error handling
 */
export function saveSeason(season: SeasonType): void {
  if (globalThis.window === undefined) {
    return
  }
  try {
    if (!VALID_SEASONS.includes(season)) {
      season = DEFAULT_SEASON
    }
    localStorage.setItem(SEASON_STORAGE_KEY, season)
  } catch {
    // localStorage unavailable
  }
}

/**
 * Validate and retrieve stored time period from localStorage
 */
export function getStoredTimePeriod(): TimePeriodType {
  if (globalThis.window === undefined) {
    return DEFAULT_PERIOD
  }
  try {
    const stored = localStorage.getItem(PERIOD_STORAGE_KEY)
    return VALID_PERIODS.includes(stored as TimePeriodType)
      ? (stored as TimePeriodType)
      : DEFAULT_PERIOD
  } catch {
    return DEFAULT_PERIOD
  }
}

/**
 * Save time period to localStorage with error handling
 */
export function saveTimePeriod(period: TimePeriodType): void {
  if (globalThis.window === undefined) {
    return
  }
  try {
    if (!VALID_PERIODS.includes(period)) {
      period = DEFAULT_PERIOD
    }
    localStorage.setItem(PERIOD_STORAGE_KEY, period)
  } catch {
    // localStorage unavailable
  }
}

/**
 * Clear stored season and time period
 */
export function clearStoredSeasonState(): void {
  if (globalThis.window === undefined) {
    return
  }
  try {
    localStorage.removeItem(SEASON_STORAGE_KEY)
    localStorage.removeItem(PERIOD_STORAGE_KEY)
  } catch {
    // localStorage unavailable
  }
}
