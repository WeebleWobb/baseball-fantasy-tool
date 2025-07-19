import { useSession, signIn, signOut } from 'next-auth/react'
import { useYahooFantasy } from '@/hooks/use-yahoo-fantasy'
import { mockUserInfo, mockPlayersWithRank } from './test-fixtures'

// =============================================================================
// MOCK DECLARATIONS - Typed mock references
// =============================================================================
export const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
export const mockUseYahooFantasy = useYahooFantasy as jest.MockedFunction<typeof useYahooFantasy>
export const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
export const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

// =============================================================================
// MOCK IMPLEMENTATIONS - Default mock behaviors
// =============================================================================

/**
 * Default mock implementation for useYahooFantasy hook
 * Provides sensible defaults for all hook methods
 */
export const createMockYahooFantasyHook = (overrides: Partial<ReturnType<typeof useYahooFantasy>> = {}) => ({
  useUserInfo: jest.fn().mockReturnValue({ 
    data: mockUserInfo, 
    isLoading: false,
    error: null 
  }),
  usePlayers: jest.fn().mockReturnValue({ 
    data: mockPlayersWithRank, 
    isLoading: false,
    error: null 
  }),
  usePlayersComprehensive: jest.fn().mockReturnValue({ 
    data: undefined, 
    isLoading: false,
    error: null 
  }),
  ...overrides
})

/**
 * Default mock implementation for useSession hook - Authenticated state
 */
export const createMockSessionAuthenticated = () => ({
  data: {
    accessToken: 'test-access-token',
    user: { name: 'Test User' },
    expires: '2024-12-31'
  },
  status: 'authenticated' as const,
  update: jest.fn()
})

/**
 * Loading state mock for useSession
 */
export const createMockSessionLoading = () => ({
  data: null,
  status: 'loading' as const,
  update: jest.fn()
})

/**
 * Unauthenticated state mock for useSession
 */
export const createMockSessionUnauthenticated = () => ({
  data: null,
  status: 'unauthenticated' as const,
  update: jest.fn()
})

// =============================================================================
// SETUP UTILITIES - Reusable mock setup functions
// =============================================================================

/**
 * Setup mocks for authenticated state with data loaded
 */
export const setupAuthenticatedWithData = () => {
  mockUseSession.mockReturnValue(createMockSessionAuthenticated())
  mockUseYahooFantasy.mockReturnValue(createMockYahooFantasyHook())
}

/**
 * Setup mocks for loading state
 */
export const setupLoadingState = () => {
  mockUseSession.mockReturnValue(createMockSessionLoading())
  mockUseYahooFantasy.mockReturnValue(createMockYahooFantasyHook({
    useUserInfo: jest.fn().mockReturnValue({ data: undefined, isLoading: true }),
    usePlayers: jest.fn().mockReturnValue({ data: undefined, isLoading: true }),
    usePlayersComprehensive: jest.fn().mockReturnValue({ data: undefined, isLoading: true })
  }))
}

/**
 * Setup mocks for unauthenticated state
 */
export const setupUnauthenticatedState = () => {
  mockUseSession.mockReturnValue(createMockSessionUnauthenticated())
  mockUseYahooFantasy.mockReturnValue(createMockYahooFantasyHook())
}

/**
 * Setup mocks for empty data state
 */
export const setupEmptyDataState = () => {
  mockUseSession.mockReturnValue(createMockSessionAuthenticated())
  mockUseYahooFantasy.mockReturnValue(createMockYahooFantasyHook({
    usePlayers: jest.fn().mockReturnValue({ data: [], isLoading: false })
  }))
}

/**
 * Setup mocks for error state
 */
export const setupErrorState = (error = new Error('Test error')) => {
  mockUseSession.mockReturnValue(createMockSessionAuthenticated())
  mockUseYahooFantasy.mockReturnValue(createMockYahooFantasyHook({
    usePlayers: jest.fn().mockReturnValue({ data: undefined, isLoading: false, error })
  }))
}

// =============================================================================
// RESET UTILITIES - Clean up functions
// =============================================================================

/**
 * Reset all mocks to their default state
 */
export const resetAllMocks = () => {
  jest.clearAllMocks()
  
  // Reset to default authenticated state
  setupAuthenticatedWithData()
}

/**
 * Clear all mock calls and instances
 */
export const clearAllMocks = () => {
  jest.clearAllMocks()
} 