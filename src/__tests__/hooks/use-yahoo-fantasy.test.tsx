import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useYahooFantasy } from '@/hooks/use-yahoo-fantasy'
import { YahooFantasyAPI } from '@/lib/yahoo-fantasy'
import { useSession, signOut } from 'next-auth/react'
import { mockUserInfo, mockPlayersSimple } from '@/__tests__/utils/test-fixtures'

// Simple inline mocks
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('@/lib/yahoo-fantasy')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
const MockedYahooFantasyAPI = YahooFantasyAPI as jest.MockedClass<typeof YahooFantasyAPI>

describe('useYahooFantasy', () => {
  let queryClient: QueryClient
  let mockApiInstance: jest.Mocked<YahooFantasyAPI>

  const createWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    mockApiInstance = {
      getUserInfo: jest.fn(),
      getMLBPlayers: jest.fn(),
      getMLBPlayersComprehensive: jest.fn(),
      getMLBGameKey: jest.fn(),
    } as unknown as jest.Mocked<YahooFantasyAPI>

    MockedYahooFantasyAPI.mockImplementation(() => mockApiInstance)
    jest.clearAllMocks()
  })

  it('should return disabled hooks when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn()
    })

    const { result } = renderHook(() => useYahooFantasy(), {
      wrapper: createWrapper,
    })

    const { useUserInfo, usePlayers, usePlayersComprehensive } = result.current
    
    const userInfoResult = renderHook(() => useUserInfo(), {
      wrapper: createWrapper,
    })
    
    const playersResult = renderHook(() => usePlayers(), {
      wrapper: createWrapper,
    })

    const playersComprehensiveResult = renderHook(() => usePlayersComprehensive(), {
      wrapper: createWrapper,
    })

    expect(userInfoResult.result.current.data).toBeUndefined()
    expect(playersResult.result.current.data).toBeUndefined()
    expect(playersComprehensiveResult.result.current.data).toBeUndefined()
  })

  it('should fetch user info when authenticated', async () => {
    mockUseSession.mockReturnValue({
      data: {
        accessToken: 'test-access-token',
        user: { name: 'Test User' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    mockApiInstance.getUserInfo.mockResolvedValue(mockUserInfo)

    const { result } = renderHook(() => useYahooFantasy(), {
      wrapper: createWrapper,
    })

    const { useUserInfo } = result.current
    const userInfoResult = renderHook(() => useUserInfo(), {
      wrapper: createWrapper,
    })

    await waitFor(() => {
      expect(userInfoResult.result.current.data).toBeDefined()
    })

    expect(mockApiInstance.getUserInfo).toHaveBeenCalledTimes(1)
    expect(userInfoResult.result.current.data).toEqual(mockUserInfo)
  })

  it('should fetch players with pagination options', async () => {
    mockUseSession.mockReturnValue({
      data: {
        accessToken: 'test-access-token',
        user: { name: 'Test User' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    mockApiInstance.getMLBPlayers.mockResolvedValue(mockPlayersSimple)

    const { result } = renderHook(() => useYahooFantasy(), {
      wrapper: createWrapper,
    })

    const { usePlayers } = result.current
    const playersResult = renderHook(() => 
      usePlayers({ start: 25, count: 50 }), {
      wrapper: createWrapper,
    })

    await waitFor(() => {
      expect(playersResult.result.current.data).toBeDefined()
    })

    expect(mockApiInstance.getMLBPlayers).toHaveBeenCalledWith({
      start: 25,
      count: 50,
      playerType: 'ALL_BATTERS'
    })
    expect(playersResult.result.current.data).toEqual(mockPlayersSimple)
  })

  it('should handle API errors gracefully', async () => {
    mockUseSession.mockReturnValue({
      data: {
        accessToken: 'test-access-token',
        user: { name: 'Test User' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    mockApiInstance.getUserInfo.mockRejectedValue(new Error('API Error'))
    mockApiInstance.getMLBPlayers.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useYahooFantasy(), {
      wrapper: createWrapper,
    })

    const { useUserInfo, usePlayers } = result.current
    
    const userInfoResult = renderHook(() => useUserInfo(), {
      wrapper: createWrapper,
    })
    
    const playersResult = renderHook(() => usePlayers(), {
      wrapper: createWrapper,
    })

    await waitFor(() => {
      expect(userInfoResult.result.current.data).toBeUndefined()
      expect(playersResult.result.current.data).toBeUndefined()
    })

    expect(mockApiInstance.getUserInfo).toHaveBeenCalled()
    expect(mockApiInstance.getMLBPlayers).toHaveBeenCalled()
  })

  it('should handle token refresh errors by signing out', () => {
    mockUseSession.mockReturnValue({
      data: {
        accessToken: 'test-access-token',
        user: { name: 'Test User' },
        expires: '2024-12-31',
        error: 'RefreshAccessTokenError' as const,
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useYahooFantasy(), {
      wrapper: createWrapper,
    })

    // Should call signOut with redirect
    expect(mockSignOut).toHaveBeenCalledWith({ redirect: true, callbackUrl: "/" })

    // Should return hooks that return error states
    const { useUserInfo, usePlayers, usePlayersComprehensive } = result.current
    
    const userInfoResult = renderHook(() => useUserInfo(), {
      wrapper: createWrapper,
    })
    
    const playersResult = renderHook(() => usePlayers(), {
      wrapper: createWrapper,
    })

    const playersComprehensiveResult = renderHook(() => usePlayersComprehensive(), {
      wrapper: createWrapper,
    })

    // Hooks should return error states
    expect(userInfoResult.result.current.data).toBeNull()
    expect(userInfoResult.result.current.error).toEqual(new Error('Session expired'))
    expect(playersResult.result.current.data).toBeNull()
    expect(playersResult.result.current.error).toEqual(new Error('Session expired'))
    expect(playersComprehensiveResult.result.current.data).toBeNull()
    expect(playersComprehensiveResult.result.current.error).toEqual(new Error('Session expired'))
  })

  it('should handle playerType parameter and create separate cache entries', async () => {
    mockUseSession.mockReturnValue({
      data: {
        accessToken: 'test-access-token',
        user: { name: 'Test User' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    mockApiInstance.getMLBPlayers.mockResolvedValue(mockPlayersSimple)

    const { result } = renderHook(() => useYahooFantasy(), {
      wrapper: createWrapper,
    })

    const { usePlayers } = result.current
    
    // Test different playerType calls
    const battersResult = renderHook(() => 
      usePlayers({ playerType: 'ALL_BATTERS' }), {
      wrapper: createWrapper,
    })

    const pitchersResult = renderHook(() => 
      usePlayers({ playerType: 'ALL_PITCHERS' }), {
      wrapper: createWrapper,
    })

    await waitFor(() => {
      expect(battersResult.result.current.data).toBeDefined()
      expect(pitchersResult.result.current.data).toBeDefined()
    })

    // Should call API with different playerType parameters
    expect(mockApiInstance.getMLBPlayers).toHaveBeenCalledWith({
      start: 0,
      count: 25,
      playerType: 'ALL_BATTERS'
    })
    
    expect(mockApiInstance.getMLBPlayers).toHaveBeenCalledWith({
      start: 0,
      count: 25,
      playerType: 'ALL_PITCHERS'
    })

    // Should have been called twice (separate cache entries)
    expect(mockApiInstance.getMLBPlayers).toHaveBeenCalledTimes(2)
  })

  describe('usePlayersComprehensive', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          accessToken: 'test-access-token',
          user: { name: 'Test User' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      })
    })

    it('should fetch comprehensive player data when fetchAll is true', async () => {
      mockApiInstance.getMLBPlayersComprehensive.mockResolvedValue(mockPlayersSimple)

      const { result } = renderHook(() => useYahooFantasy(), {
        wrapper: createWrapper,
      })

      const { usePlayersComprehensive } = result.current
      const playersResult = renderHook(() => 
        usePlayersComprehensive({ fetchAll: true, playerType: 'ALL_BATTERS' }), {
        wrapper: createWrapper,
      })

      await waitFor(() => {
        expect(playersResult.result.current.data).toBeDefined()
      })

      expect(mockApiInstance.getMLBPlayersComprehensive).toHaveBeenCalledWith({
        playerType: 'ALL_BATTERS',
        maxPlayers: 500 // Fast connection default
      })
      expect(playersResult.result.current.data).toEqual(mockPlayersSimple)
    })

    it('should not fetch when fetchAll is false', () => {
      const { result } = renderHook(() => useYahooFantasy(), {
        wrapper: createWrapper,
      })

      const { usePlayersComprehensive } = result.current
      const playersResult = renderHook(() => 
        usePlayersComprehensive({ fetchAll: false }), {
        wrapper: createWrapper,
      })

      expect(playersResult.result.current.data).toBeUndefined()
      expect(mockApiInstance.getMLBPlayersComprehensive).not.toHaveBeenCalled()
    })

    it('should handle different player types correctly', async () => {
      mockApiInstance.getMLBPlayersComprehensive.mockResolvedValue(mockPlayersSimple)

      const { result } = renderHook(() => useYahooFantasy(), {
        wrapper: createWrapper,
      })

      const { usePlayersComprehensive } = result.current
      
      // Test different playerType calls
      const battersResult = renderHook(() => 
        usePlayersComprehensive({ fetchAll: true, playerType: 'ALL_BATTERS' }), {
        wrapper: createWrapper,
      })

      const pitchersResult = renderHook(() => 
        usePlayersComprehensive({ fetchAll: true, playerType: 'ALL_PITCHERS' }), {
        wrapper: createWrapper,
      })

      await waitFor(() => {
        expect(battersResult.result.current.data).toBeDefined()
        expect(pitchersResult.result.current.data).toBeDefined()
      })

      // Should call API with different playerType parameters
      expect(mockApiInstance.getMLBPlayersComprehensive).toHaveBeenCalledWith({
        playerType: 'ALL_BATTERS',
        maxPlayers: 500
      })
      
      expect(mockApiInstance.getMLBPlayersComprehensive).toHaveBeenCalledWith({
        playerType: 'ALL_PITCHERS',
        maxPlayers: 500
      })

      // Should have been called twice (separate cache entries)
      expect(mockApiInstance.getMLBPlayersComprehensive).toHaveBeenCalledTimes(2)
    })

    it('should handle API errors gracefully', async () => {
      mockApiInstance.getMLBPlayersComprehensive.mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useYahooFantasy(), {
        wrapper: createWrapper,
      })

      const { usePlayersComprehensive } = result.current
      const playersResult = renderHook(() => 
        usePlayersComprehensive({ fetchAll: true }), {
        wrapper: createWrapper,
      })

      await waitFor(() => {
        expect(playersResult.result.current.data).toBeUndefined()
      })

      expect(mockApiInstance.getMLBPlayersComprehensive).toHaveBeenCalled()
    })
  })

  describe('Network Performance Detection', () => {
    let mockConnection: Record<string, unknown>

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          accessToken: 'test-access-token',
          user: { name: 'Test User' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      // Mock navigator.connection
      mockConnection = { effectiveType: '4g' }
      Object.defineProperty(navigator, 'connection', {
        value: mockConnection,
        writable: true,
        configurable: true,
      })
    })

    afterEach(() => {
      // Clean up navigator.connection mock
      delete (navigator as unknown as Record<string, unknown>).connection
    })

    it('should detect slow connection and use reduced player limit', () => {
      // Mock slow connection
      mockConnection.effectiveType = '2g'
      mockApiInstance.getMLBPlayersComprehensive.mockResolvedValue(mockPlayersSimple)

      const { result } = renderHook(() => useYahooFantasy(), {
        wrapper: createWrapper,
      })

      const { usePlayersComprehensive } = result.current
      renderHook(() => 
        usePlayersComprehensive({ fetchAll: true }), {
        wrapper: createWrapper,
      })

      // Should still be enabled but with reduced maxPlayers limit
      expect(mockApiInstance.getMLBPlayersComprehensive).toHaveBeenCalledWith({
        playerType: 'ALL_BATTERS',
        maxPlayers: 200 // Reduced limit for slow connections
      })
    })

    it('should use reduced player limit on slow-2g connection when fetchAll is true', () => {
      // Mock slow connection
      mockConnection.effectiveType = 'slow-2g'
      mockApiInstance.getMLBPlayersComprehensive.mockResolvedValue(mockPlayersSimple)

      const { result } = renderHook(() => useYahooFantasy(), {
        wrapper: createWrapper,
      })

      const { usePlayersComprehensive } = result.current
      renderHook(() => 
        usePlayersComprehensive({ fetchAll: true }), {
        wrapper: createWrapper,
      })

      // Should still be enabled but with reduced maxPlayers limit
      expect(mockApiInstance.getMLBPlayersComprehensive).toHaveBeenCalledWith({
        playerType: 'ALL_BATTERS',
        maxPlayers: 200 // Reduced limit for slow connections
      })
    })

    it('should use fast connection defaults when navigator.connection is not available', async () => {
      // Remove navigator.connection
      delete (navigator as unknown as Record<string, unknown>).connection
      mockApiInstance.getMLBPlayersComprehensive.mockResolvedValue(mockPlayersSimple)

      const { result } = renderHook(() => useYahooFantasy(), {
        wrapper: createWrapper,
      })

      const { usePlayersComprehensive } = result.current
      const playersResult = renderHook(() => 
        usePlayersComprehensive({ fetchAll: true }), {
        wrapper: createWrapper,
      })

      await waitFor(() => {
        expect(playersResult.result.current.data).toBeDefined()
      })

      // Should use fast connection defaults
      expect(mockApiInstance.getMLBPlayersComprehensive).toHaveBeenCalledWith({
        playerType: 'ALL_BATTERS',
        maxPlayers: 500
      })
    })
  })
}) 