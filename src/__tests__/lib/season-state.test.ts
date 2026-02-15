import {
  getStoredSeason,
  saveSeason,
  getStoredTimePeriod,
  saveTimePeriod,
  clearStoredSeasonState,
  deriveStatType
} from '@/lib/season-state'
import type { SeasonType, TimePeriodType } from '@/types/hooks'

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('season-state utilities', () => {
  const SEASON_STORAGE_KEY = 'baseball-fantasy-tool:seasonFilter'
  const PERIOD_STORAGE_KEY = 'baseball-fantasy-tool:timePeriodFilter'
  const DEFAULT_SEASON: SeasonType = 'current'
  const DEFAULT_PERIOD: TimePeriodType = 'full'

  beforeEach(() => {
    mockLocalStorage.clear()
    jest.clearAllMocks()
  })

  describe('deriveStatType', () => {
    it('should return "season" for last season (uses different game key, not stat type)', () => {
      // Last season queries previous year's game key, but stat type is still 'season'
      expect(deriveStatType('last', 'full')).toBe('season')
      expect(deriveStatType('last', 'lastmonth')).toBe('season')
      expect(deriveStatType('last', 'lastweek')).toBe('season')
    })

    it('should return "season" for current season with full period', () => {
      expect(deriveStatType('current', 'full')).toBe('season')
    })

    it('should return "lastmonth" for current season with lastmonth period', () => {
      expect(deriveStatType('current', 'lastmonth')).toBe('lastmonth')
    })

    it('should return "lastweek" for current season with lastweek period', () => {
      expect(deriveStatType('current', 'lastweek')).toBe('lastweek')
    })
  })

  describe('getStoredSeason', () => {
    it('should return stored season when valid season exists', () => {
      mockLocalStorage.setItem(SEASON_STORAGE_KEY, 'last')

      const result = getStoredSeason()

      expect(result).toBe('last')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(SEASON_STORAGE_KEY)
    })

    it('should return default season when no stored value exists', () => {
      const result = getStoredSeason()

      expect(result).toBe(DEFAULT_SEASON)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(SEASON_STORAGE_KEY)
    })

    it('should return default season when stored value is invalid', () => {
      mockLocalStorage.setItem(SEASON_STORAGE_KEY, 'INVALID_SEASON')

      const result = getStoredSeason()

      expect(result).toBe(DEFAULT_SEASON)
    })
  })

  describe('saveSeason', () => {
    it('should save valid season to localStorage', () => {
      saveSeason('last')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(SEASON_STORAGE_KEY, 'last')
    })

    it('should save default season when invalid season provided', () => {
      saveSeason('INVALID' as SeasonType)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(SEASON_STORAGE_KEY, DEFAULT_SEASON)
    })
  })

  describe('getStoredTimePeriod', () => {
    it('should return stored time period when valid period exists', () => {
      mockLocalStorage.setItem(PERIOD_STORAGE_KEY, 'lastmonth')

      const result = getStoredTimePeriod()

      expect(result).toBe('lastmonth')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(PERIOD_STORAGE_KEY)
    })

    it('should return default period when no stored value exists', () => {
      const result = getStoredTimePeriod()

      expect(result).toBe(DEFAULT_PERIOD)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(PERIOD_STORAGE_KEY)
    })

    it('should return default period when stored value is invalid', () => {
      mockLocalStorage.setItem(PERIOD_STORAGE_KEY, 'INVALID_PERIOD')

      const result = getStoredTimePeriod()

      expect(result).toBe(DEFAULT_PERIOD)
    })
  })

  describe('saveTimePeriod', () => {
    it('should save valid time period to localStorage', () => {
      saveTimePeriod('lastweek')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(PERIOD_STORAGE_KEY, 'lastweek')
    })

    it('should save default period when invalid period provided', () => {
      saveTimePeriod('INVALID' as TimePeriodType)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(PERIOD_STORAGE_KEY, DEFAULT_PERIOD)
    })
  })

  describe('clearStoredSeasonState', () => {
    it('should remove both season and period from localStorage', () => {
      mockLocalStorage.setItem(SEASON_STORAGE_KEY, 'last')
      mockLocalStorage.setItem(PERIOD_STORAGE_KEY, 'lastmonth')

      clearStoredSeasonState()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(SEASON_STORAGE_KEY)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(PERIOD_STORAGE_KEY)
    })
  })

  describe('integration scenarios', () => {
    it('should work through complete workflow for all valid values', () => {
      const validSeasons: SeasonType[] = ['current', 'last']
      const validPeriods: TimePeriodType[] = ['full', 'lastmonth', 'lastweek']

      validSeasons.forEach(season => {
        saveSeason(season)
        expect(getStoredSeason()).toBe(season)
      })

      validPeriods.forEach(period => {
        saveTimePeriod(period)
        expect(getStoredTimePeriod()).toBe(period)
      })

      // Test complete cycle: save -> retrieve -> clear -> default
      saveSeason('last')
      saveTimePeriod('lastweek')
      expect(getStoredSeason()).toBe('last')
      expect(getStoredTimePeriod()).toBe('lastweek')

      clearStoredSeasonState()
      mockLocalStorage.clear()
      expect(getStoredSeason()).toBe(DEFAULT_SEASON)
      expect(getStoredTimePeriod()).toBe(DEFAULT_PERIOD)
    })

    it('should handle all localStorage errors gracefully', () => {
      // Test getStoredSeason error handling
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      expect(getStoredSeason()).toBe(DEFAULT_SEASON)
      expect(getStoredTimePeriod()).toBe(DEFAULT_PERIOD)

      // Test saveSeason error handling
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded')
      })
      saveSeason('last') // Should not throw
      saveTimePeriod('lastmonth') // Should not throw

      // Test clearStoredSeasonState error handling
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage disabled')
      })
      clearStoredSeasonState() // Should not throw
    })
  })
})
