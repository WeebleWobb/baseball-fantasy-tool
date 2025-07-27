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
    
    expect(result.current.pageIndex).toBe(0)
    expect(result.current.searchTerm).toBe('')
    expect(result.current.activeFilter).toBe('ALL_BATTERS')
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
    expect(result.current.totalPages).toBe(1)
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
      expect(result.current.pageIndex).toBe(0) // Should reset pagination
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
      expect(result.current.pageIndex).toBe(0) // Should reset pagination
    })
  })

  it('should handle page changes', async () => {
    const { result } = setup()

    await act(async () => {
      result.current.onPageChange(1)
    })

    await waitFor(() => {
      expect(result.current.pageIndex).toBe(1)
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
}) 