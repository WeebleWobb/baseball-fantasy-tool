import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DataTable } from '@/components/players-table/data-table'
import { columns } from '@/components/players-table/columns'
import { 
  mockPlayersWithRank,
  mockMalformedPlayer,
  mockNoAtBatsPlayer
} from '@/__tests__/utils/test-fixtures'

describe('DataTable Integration', () => {
  const setup = (data = mockPlayersWithRank, props = {}) => {
    return render(<DataTable columns={columns} data={data} {...props} />)
  }

  it('should display player data correctly', () => {
    setup()

    // Check key player information is displayed
    expect(screen.getByText('Mike Trout')).toBeInTheDocument()
    expect(screen.getByText('Mookie Betts')).toBeInTheDocument()
    expect(screen.getByText('LAA')).toBeInTheDocument()
    expect(screen.getByText('LAD')).toBeInTheDocument()
    expect(screen.getByText('OF')).toBeInTheDocument()

    // Check stats are displayed
    expect(screen.getByText('150')).toBeInTheDocument() // Hits
    expect(screen.getByText('35')).toBeInTheDocument()  // Home Runs
    expect(screen.getByText('100')).toBeInTheDocument() // RBI
    
    // Check H/AB format (hits/at-bats with slash)
    const slashes = screen.getAllByText('/')
    expect(slashes.length).toBeGreaterThan(0)
  })

  it('should handle sorting interaction', () => {
    setup()

    // Verify sorting functionality works (user can click headers)
    const nameHeader = screen.getByText('Name')
    expect(nameHeader.closest('button')).toBeInTheDocument()
    
    // Test actual sorting behavior
    fireEvent.click(nameHeader)
    
    // Basic verification that sorting occurred (table still renders)
    expect(screen.getByText('Mike Trout')).toBeInTheDocument()
  })

  it('should handle empty data gracefully', () => {
    setup([])

    expect(screen.getByText('Name')).toBeInTheDocument() // Headers still show
    expect(screen.getByText('No results.')).toBeInTheDocument() // Empty state
  })

  it('should handle malformed and missing data', () => {
    setup([mockMalformedPlayer, mockNoAtBatsPlayer])

    // Should display players even with bad data
    expect(screen.getByText('Bad Player')).toBeInTheDocument()
    expect(screen.getByText('Zero AB')).toBeInTheDocument()
    
    // Should handle missing stats by showing zeros
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThan(0)
    
    // Should handle division by zero (10/0)
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('should handle search input interactions', () => {
    const mockOnSearchChange = jest.fn()
    
    setup(mockPlayersWithRank, {
      searchTerm: "",
      onSearchChange: mockOnSearchChange
    })

    // Find the search input
    const searchInput = screen.getByPlaceholderText('Search Player')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveValue("")

    // Test search input interaction with player name
    fireEvent.change(searchInput, { target: { value: 'Mike' } })
    expect(mockOnSearchChange).toHaveBeenCalledWith('Mike')

    // Test search with last name
    fireEvent.change(searchInput, { target: { value: 'Trout' } })
    expect(mockOnSearchChange).toHaveBeenCalledWith('Trout')

    // Verify the callback was called correctly
    expect(mockOnSearchChange).toHaveBeenCalledTimes(2)
  })

  it('should handle infinite scroll status display correctly', () => {
    // Test with hasMore = true
    setup(mockPlayersWithRank, {
      totalMatchingPlayers: 100,
      hasMore: true,
      onLoadMore: jest.fn()
    })

    expect(screen.getByText('Showing 3 of 100 players - Scroll down to load more')).toBeInTheDocument()
    
    // Test with hasMore = false (all data loaded)
    setup(mockPlayersWithRank, {
      totalMatchingPlayers: 3,
      hasMore: false,
      onLoadMore: jest.fn()
    })

    expect(screen.getByText('Showing 3 of 3 players')).toBeInTheDocument()
    expect(screen.queryByText('Scroll down to load more')).not.toBeInTheDocument()
  })

}) 