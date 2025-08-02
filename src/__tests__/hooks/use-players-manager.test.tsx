import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { usePlayersManager } from '@/hooks/use-players-manager'
import { useYahooFantasy } from '@/hooks/use-yahoo-fantasy'
import { getStoredFilter, saveFilter } from '@/lib/filter-state'

// Mock dependencies
jest.mock('@/hooks/use-yahoo-fantasy')
jest.mock('@/lib/filter-state')
jest.mock('@/components/players-table/columns', () => ({
  getColumns: jest.fn(() => [{ id: 'name', header: 'Name' }])
}))

const mockUseYahooFantasy = useYahooFantasy as jest.MockedFunction<typeof useYahooFantasy>
const mockGetStoredFilter = getStoredFilter as jest.MockedFunction<typeof getStoredFilter>
const mockSaveFilter = saveFilter as jest.MockedFunction<typeof saveFilter>

describe('usePlayersManager', () => {
  let queryClient: QueryClient

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    const TestWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
    TestWrapper.displayName = 'TestWrapper'
    return TestWrapper
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetStoredFilter.mockReturnValue('ALL_BATTERS')
    
    // Simple default mock
    const mockUsePlayersComprehensive = jest.fn().mockReturnValue({
      data: [
        {
          name: { full: 'Test Player' },
          display_position: 'OF',
          player_key: '1'
        }
      ],
      isLoading: false
    })
    
    mockUseYahooFantasy.mockReturnValue({
      usePlayersComprehensive: mockUsePlayersComprehensive,
      useUserInfo: jest.fn(),
      usePlayers: jest.fn()
    })
  })

  const setup = () => {
    const wrapper = createWrapper()
    return renderHook(() => usePlayersManager(), { wrapper })
  }

  it('should initialize with default states', () => {
    const { result } = setup()
    
    expect(result.current.searchTerm).toBe('')
    expect(result.current.activeFilter).toBe('ALL_BATTERS')
    expect(result.current.hasMore).toBe(false) // Single player, rendered count is 25
    expect(result.current.totalMatchingPlayers).toBe(1)
  })

  it('should handle empty dataset', () => {
    const mockEmpty = jest.fn().mockReturnValue({
      data: null,
      isLoading: false
    })
    
    mockUseYahooFantasy.mockReturnValue({
      usePlayersComprehensive: mockEmpty,
      useUserInfo: jest.fn(),
      usePlayers: jest.fn()
    })

    const { result } = setup()

    expect(result.current.filteredPlayers).toEqual([])
    expect(result.current.totalFilteredCount).toBe(0)
    expect(result.current.totalMatchingPlayers).toBe(0)
    expect(result.current.hasMore).toBe(false)
  })

  it('should handle loading state', () => {
    const mockLoading = jest.fn().mockReturnValue({
      data: null,
      isLoading: true
    })
    
    mockUseYahooFantasy.mockReturnValue({
      usePlayersComprehensive: mockLoading,
      useUserInfo: jest.fn(),
      usePlayers: jest.fn()
    })

    const { result } = setup()

    expect(result.current.isLoading).toBe(true)
  })

  it('should handle filter changes and save to localStorage', async () => {
    const { result } = setup()

    await act(async () => {
      result.current.onFilterChange('ALL_PITCHERS')
    })

    await waitFor(() => {
      expect(result.current.activeFilter).toBe('ALL_PITCHERS')
      expect(result.current.searchTerm).toBe('') // Should reset search
      expect(mockSaveFilter).toHaveBeenCalledWith('ALL_PITCHERS')
    })
  })

  it('should handle search changes', async () => {
    const { result } = setup()

    await act(async () => {
      result.current.onSearchChange('test')
    })

    await waitFor(() => {
      expect(result.current.searchTerm).toBe('test')
    })
  })

  it('should handle load more functionality', async () => {
    // Setup with many players to test infinite scroll
    const manyPlayers = Array.from({ length: 50 }, (_, i) => ({
      name: { full: `Player ${i + 1}` },
      display_position: 'OF',
      player_key: `${i + 1}`
    }))

    const mockManyPlayers = jest.fn().mockReturnValue({
      data: manyPlayers,
      isLoading: false
    })
    
    mockUseYahooFantasy.mockReturnValue({
      usePlayersComprehensive: mockManyPlayers,
      useUserInfo: jest.fn(),
      usePlayers: jest.fn()
    })

    const { result } = setup()

    // Initially should show 25 players with hasMore true
    expect(result.current.filteredPlayers).toHaveLength(25)
    expect(result.current.hasMore).toBe(true)
    expect(result.current.totalMatchingPlayers).toBe(50)

    await act(async () => {
      result.current.loadMorePlayers()
    })

    await waitFor(() => {
      expect(result.current.filteredPlayers).toHaveLength(50)
      expect(result.current.hasMore).toBe(false)
    })
  })

  it('should generate columns', () => {
    const { result } = setup()

    expect(result.current.columns).toBeDefined()
    expect(Array.isArray(result.current.columns)).toBe(true)
  })

  it('should add global rank to players', () => {
    const { result } = setup()

    if (result.current.filteredPlayers.length > 0) {
      expect(result.current.filteredPlayers[0]).toHaveProperty('globalRank', 1)
    }
  })

  describe('Ranking Preservation', () => {
    beforeEach(() => {
      // Mock comprehensive player data with multiple players for ranking tests
      const mockPlayersData = [
        { name: { full: 'Mike Trout' }, display_position: 'OF', player_key: '1' },      // Yahoo rank #1 
        { name: { full: 'Ronald Acuna Jr.' }, display_position: 'OF', player_key: '2' }, // Yahoo rank #2
        { name: { full: 'Mookie Betts' }, display_position: 'OF', player_key: '3' },    // Yahoo rank #3
        { name: { full: 'Fernando Tatis Jr.' }, display_position: 'SS', player_key: '4' }, // Yahoo rank #4
        { name: { full: 'Juan Soto' }, display_position: 'OF', player_key: '5' },       // Yahoo rank #5
      ]

      const mockUsePlayersComprehensive = jest.fn().mockReturnValue({
        data: mockPlayersData,
        isLoading: false
      })
      
      mockUseYahooFantasy.mockReturnValue({
        usePlayersComprehensive: mockUsePlayersComprehensive,
        useUserInfo: jest.fn(),
        usePlayers: jest.fn()
      })
    })

    it('should preserve Yahoo original rankings (sort=AR order)', () => {
      const { result } = setup()
      
      const players = result.current.filteredPlayers
      expect(players).toHaveLength(5)
      
      // Verify original rankings are preserved from Yahoo's sort=AR order
      expect(players[0]).toHaveProperty('originalRank', 1) // Mike Trout
      expect(players[1]).toHaveProperty('originalRank', 2) // Ronald Acuna Jr.
      expect(players[2]).toHaveProperty('originalRank', 3) // Mookie Betts
      expect(players[3]).toHaveProperty('originalRank', 4) // Fernando Tatis Jr.
      expect(players[4]).toHaveProperty('originalRank', 5) // Juan Soto
    })

    it('should maintain original rankings through position filtering', () => {
      const { result } = setup()
      
      // Filter to only outfielders (OF)
      act(() => {
        result.current.onFilterChange('OF')
      })
      
      const filteredPlayers = result.current.filteredPlayers
      
      // Should have 3 outfielders: Trout (#1), Acuna (#2), Betts (#3), Soto (#5)
      expect(filteredPlayers).toHaveLength(4)
      
      // Original rankings should be preserved despite filtering
      expect(filteredPlayers[0]).toHaveProperty('originalRank', 1) // Trout still #1
      expect(filteredPlayers[1]).toHaveProperty('originalRank', 2) // Acuna still #2  
      expect(filteredPlayers[2]).toHaveProperty('originalRank', 3) // Betts still #3
      expect(filteredPlayers[3]).toHaveProperty('originalRank', 5) // Soto still #5
      
      // But globalRank should reflect filtered positions
      expect(filteredPlayers[0]).toHaveProperty('globalRank', 1) // 1st in filtered list
      expect(filteredPlayers[1]).toHaveProperty('globalRank', 2) // 2nd in filtered list
      expect(filteredPlayers[2]).toHaveProperty('globalRank', 3) // 3rd in filtered list
      expect(filteredPlayers[3]).toHaveProperty('globalRank', 4) // 4th in filtered list
    })

    it('should maintain original rankings through search filtering', () => {
      const { result } = setup()
      
      // Search for "Soto" - should return only Juan Soto
      act(() => {
        result.current.onSearchChange('Soto')
      })
      
      const searchResults = result.current.filteredPlayers
      
      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].name.full).toBe('Juan Soto')
      
      // Original Yahoo ranking should be preserved
      expect(searchResults[0]).toHaveProperty('originalRank', 5) // Still Yahoo's #5 player
      
      // But globalRank should be 1 since it's the only result
      expect(searchResults[0]).toHaveProperty('globalRank', 1) // 1st in search results
    })

    it('should maintain original rankings with combined filters and search', () => {
      const { result } = setup()
      
      // Apply both position filter and search
      act(() => {
        result.current.onFilterChange('OF')
      })
      
      act(() => {
        result.current.onSearchChange('Mookie')
      })
      
      const results = result.current.filteredPlayers
      
      expect(results).toHaveLength(1)
      expect(results[0].name.full).toBe('Mookie Betts')
      
      // Should preserve original Yahoo ranking despite complex filtering
      expect(results[0]).toHaveProperty('originalRank', 3) // Still Yahoo's #3 player
      expect(results[0]).toHaveProperty('globalRank', 1) // 1st in combined filter results
    })

    it('should handle empty search results while preserving rankings', () => {
      const { result } = setup()
      
      // Search for non-existent player
      act(() => {
        result.current.onSearchChange('NonExistentPlayer')
      })
      
      const results = result.current.filteredPlayers
      
      expect(results).toHaveLength(0)
      expect(result.current.totalMatchingPlayers).toBe(0)
    })
  })
}) 