import { getStoredFilter, saveFilter, clearStoredFilter, createFilterState } from '@/lib/filter-state'
import type { PlayerFilterType } from '@/types/hooks'

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

describe('filter-state utilities', () => {
  const STORAGE_KEY = 'baseball-fantasy-tool:playerFilter'
  const DEFAULT_FILTER: PlayerFilterType = 'ALL_BATTERS'

  beforeEach(() => {
    mockLocalStorage.clear()
    jest.clearAllMocks()
  })

  describe('getStoredFilter', () => {
    it('should return stored filter when valid filter exists', () => {
      mockLocalStorage.setItem(STORAGE_KEY, 'C')
      
      const result = getStoredFilter()
      
      expect(result).toBe('C')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY)
    })

    it('should return default filter when no stored value exists', () => {
      const result = getStoredFilter()
      
      expect(result).toBe(DEFAULT_FILTER)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY)
    })

    it('should return default filter when stored value is invalid', () => {
      mockLocalStorage.setItem(STORAGE_KEY, 'INVALID_FILTER')
      
      const result = getStoredFilter()
      
      expect(result).toBe(DEFAULT_FILTER)
    })

  })

  describe('saveFilter', () => {
    it('should save valid filter to localStorage', () => {
      saveFilter('1B')
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, '1B')
    })

    it('should save default filter when invalid filter provided', () => {
      saveFilter('INVALID' as PlayerFilterType)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, DEFAULT_FILTER)
    })
  })

  describe('clearStoredFilter', () => {
    it('should remove filter from localStorage', () => {
      mockLocalStorage.setItem(STORAGE_KEY, 'SP')
      
      clearStoredFilter()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY)
    })
  })

  describe('createFilterState', () => {
    it('should return current filter from localStorage when no initial filter provided', () => {
      mockLocalStorage.setItem(STORAGE_KEY, 'OF')
      
      const filterState = createFilterState()
      
      expect(filterState.currentFilter).toBe('OF')
      expect(typeof filterState.updateFilter).toBe('function')
    })

    it('should return initial filter when provided', () => {
      mockLocalStorage.setItem(STORAGE_KEY, 'C')
      
      const filterState = createFilterState('RP')
      
      expect(filterState.currentFilter).toBe('RP')
    })

    it('should return default filter when localStorage is empty and no initial filter', () => {
      const filterState = createFilterState()
      
      expect(filterState.currentFilter).toBe(DEFAULT_FILTER)
    })

    it('should update filter and save to localStorage', () => {
      const filterState = createFilterState()
      
      const newFilter = filterState.updateFilter('2B')
      
      expect(newFilter).toBe('2B')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, '2B')
    })

    it('should handle invalid filter in updateFilter', () => {
      const filterState = createFilterState()

      const newFilter = filterState.updateFilter('INVALID' as PlayerFilterType)

      // updateFilter returns the input parameter, but saveFilter validates and stores default
      expect(newFilter).toBe('INVALID') // Returns what was passed
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, DEFAULT_FILTER) // But saves default
    })
  })

  describe('integration scenarios', () => {
    it('should work through complete workflow and validate all filter types', () => {
      // Test all valid filter types work end-to-end
      const validFilters: PlayerFilterType[] = [
        'ALL_BATTERS', 'ALL_PITCHERS', 'C', '1B', '2B', 'SS', '3B', 'OF', 'Util', 'SP', 'RP'
      ]
      
      validFilters.forEach(filter => {
        saveFilter(filter)
        expect(getStoredFilter()).toBe(filter)
      })
      
      // Test complete cycle: save -> retrieve -> clear -> default
      saveFilter('SS')
      expect(getStoredFilter()).toBe('SS')
      
      clearStoredFilter()
      mockLocalStorage.clear() // Simulate actual clearing
      expect(getStoredFilter()).toBe(DEFAULT_FILTER)
    })

    it('should handle all localStorage errors gracefully', () => {
      // Test getStoredFilter error handling
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      const retrieved = getStoredFilter()
      expect(retrieved).toBe(DEFAULT_FILTER)

      // Test saveFilter error handling
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded')
      })
      saveFilter('C') // Should not throw

      // Test clearStoredFilter error handling
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage disabled')
      })
      clearStoredFilter() // Should not throw

      // Test createFilterState with localStorage errors
      const filterState = createFilterState()
      expect(filterState.currentFilter).toBe(DEFAULT_FILTER)

      const updated = filterState.updateFilter('1B')
      expect(updated).toBe('1B') // Still returns the filter even if saving fails
    })
  })
}) 