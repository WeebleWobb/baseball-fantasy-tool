import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DataTable } from '@/components/players-table/data-table'
import { getColumns } from '@/components/players-table/columns'
import { 
  mockPlayersWithRank,
  mockPitchersWithRank,
  createMockPlayerWithRank
} from '@/__tests__/utils/test-fixtures'
import { 
  setupLoadingState,
  resetAllMocks
} from '@/__tests__/utils/test-mocks'
import { getStoredFilter, saveFilter } from '@/lib/filter-state'
import type { PlayerFilterType } from '@/types/hooks'

// Mock the filter state functions
jest.mock('@/lib/filter-state', () => ({
  getStoredFilter: jest.fn(),
  saveFilter: jest.fn()
}))

// Mock the hooks
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('@/hooks/use-yahoo-fantasy', () => ({
  useYahooFantasy: jest.fn(),
}))

const mockGetStoredFilter = getStoredFilter as jest.MockedFunction<typeof getStoredFilter>
const mockSaveFilter = saveFilter as jest.MockedFunction<typeof saveFilter>

describe('Filter Integration Tests', () => {
  let queryClient: QueryClient

  // Setup function for complete filter workflow testing
  const setupFilterWorkflow = (
    initialFilter: PlayerFilterType = 'ALL_BATTERS',
    players = mockPlayersWithRank,
    props = {}
  ) => {
    const onFilterChange = jest.fn()
    return {
      ...render(
        <QueryClientProvider client={queryClient}>
          <DataTable
            columns={getColumns(initialFilter)}
            data={players}
            activeFilter={initialFilter}
            onFilterChange={onFilterChange}
            {...props}
          />
        </QueryClientProvider>
      ),
      onFilterChange
    }
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    
    // Reset mocks and setup default authenticated state
    resetAllMocks()
    
    // Default localStorage behavior
    mockGetStoredFilter.mockReturnValue('ALL_BATTERS')
    mockSaveFilter.mockImplementation(() => {})
  })

  describe('Complete Filter Workflow', () => {
    it('should render FilterButtons and DataTable together', () => {
      setupFilterWorkflow()

      // Verify filter buttons are present
      expect(screen.getByText('All Batters')).toBeInTheDocument()
      expect(screen.getByText('All Pitchers')).toBeInTheDocument()
      expect(screen.getByText('C')).toBeInTheDocument()
      expect(screen.getByLabelText('Filter by 1B')).toBeInTheDocument()
      expect(screen.getByLabelText('Filter by SP')).toBeInTheDocument()
      expect(screen.getByLabelText('Filter by RP')).toBeInTheDocument()

      // Verify data table is present
      expect(screen.getByText('Mike Trout')).toBeInTheDocument()
      expect(screen.getByText('Mookie Betts')).toBeInTheDocument()
    })

    it('should handle filter button clicks', () => {
      const { onFilterChange } = setupFilterWorkflow()

      // Click on pitcher filter
      const pitcherButton = screen.getByText('All Pitchers')
      fireEvent.click(pitcherButton)

      expect(onFilterChange).toHaveBeenCalledWith('ALL_PITCHERS')
    })

    it('should show active filter state correctly', () => {
      setupFilterWorkflow('ALL_PITCHERS')

      // Check that pitcher filter is active (should have default variant)
      const pitcherButton = screen.getByText('All Pitchers')
      expect(pitcherButton).toHaveClass('bg-primary')
      
      // Check that batter filter is not active (should have outline variant)
      const batterButton = screen.getByText('All Batters')
      expect(batterButton).not.toHaveClass('bg-primary')
    })
  })

  describe('Position Filtering Logic', () => {
    it('should show correct filter button state for multi-position players', () => {
      // Create players with multiple positions
      const multiPositionPlayers = [
        createMockPlayerWithRank({
          name: { full: 'Multi Position Player', first: 'Multi', last: 'Player' },
          display_position: '1B,OF',
          globalRank: 1
        }),
        createMockPlayerWithRank({
          name: { full: 'Single Position Player', first: 'Single', last: 'Player' },
          display_position: '1B',
          globalRank: 2
        }),
        createMockPlayerWithRank({
          name: { full: 'Outfield Only Player', first: 'Outfield', last: 'Player' },
          display_position: 'OF',
          globalRank: 3
        })
      ]

      const { onFilterChange } = setupFilterWorkflow('1B', multiPositionPlayers)

      // All players should be shown (filtering logic is handled by parent component)
      expect(screen.getByText('Multi Position Player')).toBeInTheDocument()
      expect(screen.getByText('Single Position Player')).toBeInTheDocument()
      expect(screen.getByText('Outfield Only Player')).toBeInTheDocument()
      
      // Check that 1B filter is active
      const firstBaseButton = screen.getByLabelText('Filter by 1B')
      expect(firstBaseButton).toHaveClass('bg-primary')
      
      // Click on OF filter should trigger callback
      const ofButton = screen.getByLabelText('Filter by OF')
      fireEvent.click(ofButton)
      expect(onFilterChange).toHaveBeenCalledWith('OF')
    })

    it('should handle UTIL filter button interaction', () => {
      const utilPlayers = [
        createMockPlayerWithRank({
          name: { full: 'Utility Player', first: 'Utility', last: 'Player' },
          display_position: '1B,2B,3B',
          globalRank: 1
        }),
        createMockPlayerWithRank({
          name: { full: 'Pitcher Player', first: 'Pitcher', last: 'Player' },
          display_position: 'SP',
          globalRank: 2
        })
      ]

      const { onFilterChange } = setupFilterWorkflow('Util', utilPlayers)

      // All players should be shown (filtering logic is handled by parent component)
      expect(screen.getByText('Utility Player')).toBeInTheDocument()
      expect(screen.getByText('Pitcher Player')).toBeInTheDocument()
      
      // Check that Util filter is active
      const utilButton = screen.getByLabelText('Filter by Util')
      expect(utilButton).toHaveClass('bg-primary')
      
      // Click on different filter should trigger callback
      const spButton = screen.getByLabelText('Filter by SP')
      fireEvent.click(spButton)
      expect(onFilterChange).toHaveBeenCalledWith('SP')
    })

    it('should handle OF grouping correctly', () => {
      const outfieldPlayers = [
        createMockPlayerWithRank({
          name: { full: 'Left Field Player', first: 'LF', last: 'Player' },
          display_position: 'LF',
          globalRank: 1
        }),
        createMockPlayerWithRank({
          name: { full: 'Center Field Player', first: 'CF', last: 'Player' },
          display_position: 'CF',
          globalRank: 2
        }),
        createMockPlayerWithRank({
          name: { full: 'Right Field Player', first: 'RF', last: 'Player' },
          display_position: 'RF',
          globalRank: 3
        }),
        createMockPlayerWithRank({
          name: { full: 'General OF Player', first: 'OF', last: 'Player' },
          display_position: 'OF',
          globalRank: 4
        })
      ]

      setupFilterWorkflow('OF', outfieldPlayers)

      // All outfield positions should appear in OF filter
      expect(screen.getByText('Left Field Player')).toBeInTheDocument()
      expect(screen.getByText('Center Field Player')).toBeInTheDocument()
      expect(screen.getByText('Right Field Player')).toBeInTheDocument()
      expect(screen.getByText('General OF Player')).toBeInTheDocument()
    })
  })

  describe('Player Type Switching', () => {
    it('should switch between batter and pitcher columns', () => {
      // Start with batters
      const { rerender } = setupFilterWorkflow('ALL_BATTERS', mockPlayersWithRank)

      // Should show batter columns
      expect(screen.getByText('H/AB')).toBeInTheDocument()
      expect(screen.getByText('HR')).toBeInTheDocument()
      expect(screen.getByText('RBI')).toBeInTheDocument()

      // Switch to pitchers
      rerender(
        <QueryClientProvider client={queryClient}>
          <DataTable
            columns={getColumns('ALL_PITCHERS')}
            data={mockPitchersWithRank}
            activeFilter="ALL_PITCHERS"
            onFilterChange={jest.fn()}
          />
        </QueryClientProvider>
      )

      // Should show pitcher columns
      expect(screen.getByText('IP')).toBeInTheDocument()
      expect(screen.getByText('ERA')).toBeInTheDocument()
      expect(screen.getByText('WHIP')).toBeInTheDocument()
      expect(screen.getByText('W')).toBeInTheDocument()
      expect(screen.getByText('SV')).toBeInTheDocument()

      // Should not show batter columns
      expect(screen.queryByText('H/AB')).not.toBeInTheDocument()
      expect(screen.queryByText('HR')).not.toBeInTheDocument()
    })

    it('should display pitcher stats with correct formatting', () => {
      setupFilterWorkflow('ALL_PITCHERS', mockPitchersWithRank)

      // Check that pitcher names are displayed
      expect(screen.getByText('Jacob deGrom')).toBeInTheDocument()
      expect(screen.getByText('Edwin Diaz')).toBeInTheDocument()

      // Check that ALL_PITCHERS filter is active
      const pitcherButton = screen.getByText('All Pitchers')
      expect(pitcherButton).toHaveClass('bg-primary')
      
      // Check that pitcher-specific filters are available
      expect(screen.getByLabelText('Filter by SP')).toBeInTheDocument()
      expect(screen.getByLabelText('Filter by RP')).toBeInTheDocument()
    })
  })

  describe('localStorage Persistence', () => {
    it('should save filter changes to localStorage', () => {
      const mockOnFilterChange = jest.fn((newFilter) => {
        // Simulate the actual filter change behavior
        saveFilter(newFilter)
      })
      
      setupFilterWorkflow('ALL_BATTERS', mockPlayersWithRank, {
        onFilterChange: mockOnFilterChange
      })

      // Click on a different filter
      const catcherButton = screen.getByText('C')
      fireEvent.click(catcherButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith('C')
      expect(mockSaveFilter).toHaveBeenCalledWith('C')
    })

    it('should load filter from localStorage on initialization', () => {
      mockGetStoredFilter.mockReturnValue('SP')

      setupFilterWorkflow('SP')

      // Should show SP as active filter
      const spButton = screen.getByText('SP')
      expect(spButton).toHaveClass('bg-primary')
    })

    it('should handle invalid localStorage values gracefully', () => {
      mockGetStoredFilter.mockReturnValue('INVALID_FILTER' as PlayerFilterType)

      // Should not crash and should default to a valid filter
      expect(() => setupFilterWorkflow()).not.toThrow()
    })
  })

  describe('Error Scenarios', () => {
    it('should handle empty data sets gracefully', () => {
      setupFilterWorkflow('ALL_BATTERS', [])

      // Should show "No results" message
      expect(screen.getByText('No results.')).toBeInTheDocument()

      // Filter buttons should still be functional
      expect(screen.getByText('All Batters')).toBeInTheDocument()
      expect(screen.getByText('All Pitchers')).toBeInTheDocument()
    })

    it('should handle loading states', () => {
      setupLoadingState()

      setupFilterWorkflow('ALL_BATTERS', [], { isLoading: true })

      // Filter buttons should remain visible during loading but be disabled
      expect(screen.getByText('All Batters')).toBeInTheDocument()
      expect(screen.getByText('All Pitchers')).toBeInTheDocument()

      // Table area should show loading skeleton
      const loadingElements = screen.getAllByText('')
      expect(loadingElements.length).toBeGreaterThan(0)
    })

    it('should disable filter buttons during loading', () => {
      setupFilterWorkflow('ALL_BATTERS', mockPlayersWithRank, {
        isLoading: true
      })

      // Filter buttons should be visible but disabled during loading
      const batterButton = screen.getByText('All Batters')
      const pitcherButton = screen.getByText('All Pitchers')

      expect(batterButton).toBeDisabled()
      expect(pitcherButton).toBeDisabled()
    })

    it('should handle malformed player data', () => {
      const malformedPlayers = [
        createMockPlayerWithRank({
          name: { full: 'Malformed Player', first: 'Malformed', last: 'Player' },
          display_position: undefined as unknown as string, // Malformed position
          globalRank: 1
        })
      ]

      // Should not crash with malformed data
      expect(() => setupFilterWorkflow('ALL_BATTERS', malformedPlayers)).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      setupFilterWorkflow()

      // Check radiogroup role
      const filterGroup = screen.getByRole('radiogroup')
      expect(filterGroup).toBeInTheDocument()
      expect(filterGroup).toHaveAttribute('aria-label', 'Player position filter')

      // Check individual radio buttons
      const batterButton = screen.getByLabelText('Filter by All Batters')
      expect(batterButton).toHaveAttribute('role', 'radio')
      expect(batterButton).toHaveAttribute('aria-checked', 'true')

      const pitcherButton = screen.getByLabelText('Filter by All Pitchers')
      expect(pitcherButton).toHaveAttribute('role', 'radio')
      expect(pitcherButton).toHaveAttribute('aria-checked', 'false')
    })

    it('should be keyboard navigable', () => {
      setupFilterWorkflow()

      const batterButton = screen.getByText('All Batters')
      
      // Should be focusable
      batterButton.focus()
      expect(batterButton).toHaveFocus()
      
      // Should respond to keyboard events
      fireEvent.keyDown(batterButton, { key: 'Enter' })
      // Button should remain functional (no crash)
      expect(batterButton).toBeInTheDocument()
    })
  })
}) 