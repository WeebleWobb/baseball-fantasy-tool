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

    const { useUserInfo, usePlayers } = result.current
    
    const userInfoResult = renderHook(() => useUserInfo(), {
      wrapper: createWrapper,
    })
    
    const playersResult = renderHook(() => usePlayers(), {
      wrapper: createWrapper,
    })

    expect(userInfoResult.result.current.data).toBeUndefined()
    expect(playersResult.result.current.data).toBeUndefined()
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
      count: 50
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
    const { useUserInfo, usePlayers } = result.current
    
    const userInfoResult = renderHook(() => useUserInfo(), {
      wrapper: createWrapper,
    })
    
    const playersResult = renderHook(() => usePlayers(), {
      wrapper: createWrapper,
    })

    // Hooks should return error states
    expect(userInfoResult.result.current.data).toBeNull()
    expect(userInfoResult.result.current.error).toEqual(new Error('Session expired'))
    expect(playersResult.result.current.data).toBeNull()
    expect(playersResult.result.current.error).toEqual(new Error('Session expired'))
  })

}) 