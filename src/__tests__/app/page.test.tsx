import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from '@/app/page'
import { mockUserInfo, mockPlayersWithRank } from '@/__tests__/utils/test-fixtures'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useYahooFantasy } from '@/hooks/use-yahoo-fantasy'

// Simple inline mocks
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('@/hooks/use-yahoo-fantasy', () => ({
  useYahooFantasy: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  usePathname: jest.fn(() => '/'),
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockUseYahooFantasy = useYahooFantasy as jest.MockedFunction<typeof useYahooFantasy>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

describe('Home Page', () => {
  let queryClient: QueryClient

  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    )
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    jest.clearAllMocks()
  })

  it('should display loading state when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn()
    })
    
    mockUseYahooFantasy.mockReturnValue({
      useUserInfo: jest.fn().mockReturnValue({ data: undefined, isLoading: true }),
      usePlayers: jest.fn().mockReturnValue({ data: undefined, isLoading: true }),
      usePlayersComprehensive: jest.fn().mockReturnValue({ data: undefined, isLoading: true })
    })
    
    renderWithProviders()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should display user interface when authenticated and data is loaded', () => {
    mockUseSession.mockReturnValue({
      data: {
        accessToken: 'test-access-token',
        user: { name: null },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn()
    })

    mockUseYahooFantasy.mockReturnValue({
      useUserInfo: jest.fn().mockReturnValue({ data: mockUserInfo, isLoading: false }),
      usePlayers: jest.fn().mockReturnValue({ data: mockPlayersWithRank, isLoading: false }),
      usePlayersComprehensive: jest.fn().mockReturnValue({ data: mockPlayersWithRank, isLoading: false })
    })

    renderWithProviders()
    
    expect(screen.getByText(/Test User/)).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
    expect(screen.getByText('Mike Trout')).toBeInTheDocument()
    expect(screen.getByText('T')).toBeInTheDocument() // Avatar fallback
  })

  it('should handle empty players data', () => {
    mockUseSession.mockReturnValue({
      data: {
        accessToken: 'test-access-token',
        user: { name: 'Test User' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn()
    })

    mockUseYahooFantasy.mockReturnValue({
      useUserInfo: jest.fn().mockReturnValue({ data: mockUserInfo, isLoading: false }),
      usePlayers: jest.fn().mockReturnValue({ data: [], isLoading: false }),
      usePlayersComprehensive: jest.fn().mockReturnValue({ data: undefined, isLoading: false })
    })

    renderWithProviders()
    
    expect(screen.getByText('No results.')).toBeInTheDocument()
  })

  it('should handle missing user data with fallbacks', () => {
    mockUseSession.mockReturnValue({
      data: {
        accessToken: 'test-access-token',
        user: { name: 'Test User' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn()
    })

    mockUseYahooFantasy.mockReturnValue({
      useUserInfo: jest.fn().mockReturnValue({ 
        data: {
          fantasy_content: {
            users: [{
              user: [
                {},
                {
                  profile: {
                    // Missing display_name, image_url, fantasy_profile_url
                  }
                }
              ]
            }]
          }
        }, 
        isLoading: false 
      }),
      usePlayers: jest.fn().mockReturnValue({ data: [], isLoading: false }),
      usePlayersComprehensive: jest.fn().mockReturnValue({ data: undefined, isLoading: false })
    })

    renderWithProviders()
    
    expect(screen.getByText('Welcome, User')).toBeInTheDocument()
    expect(screen.getByText('U')).toBeInTheDocument()
  })

  it('should handle sign-in button click when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn()
    })
    
    mockUseYahooFantasy.mockReturnValue({
      useUserInfo: jest.fn().mockReturnValue({ data: undefined, isLoading: false }),
      usePlayers: jest.fn().mockReturnValue({ data: undefined, isLoading: false }),
      usePlayersComprehensive: jest.fn().mockReturnValue({ data: undefined, isLoading: false })
    })
    
    renderWithProviders()
    
    const signInButton = screen.getByRole('button', { name: /sign in with yahoo/i })
    fireEvent.click(signInButton)
    
    expect(mockSignIn).toHaveBeenCalledWith('yahoo', { callbackUrl: '/' })
  })

  it('should handle sign-out button click when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        accessToken: 'test-access-token',
        user: { name: 'Test User' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn()
    })

    mockUseYahooFantasy.mockReturnValue({
      useUserInfo: jest.fn().mockReturnValue({ data: mockUserInfo, isLoading: false }),
      usePlayers: jest.fn().mockReturnValue({ data: mockPlayersWithRank, isLoading: false }),
      usePlayersComprehensive: jest.fn().mockReturnValue({ data: mockPlayersWithRank, isLoading: false })
    })

    renderWithProviders()
    
    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutButton)
    
    expect(mockSignOut).toHaveBeenCalledWith({ redirect: true, callbackUrl: "/" })
  })

  it('should display filter buttons for user interaction', () => {
    mockUseSession.mockReturnValue({
      data: {
        accessToken: 'test-access-token',
        user: { name: 'Test User' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn()
    })

    mockUseYahooFantasy.mockReturnValue({
      useUserInfo: jest.fn().mockReturnValue({ data: mockUserInfo, isLoading: false }),
      usePlayers: jest.fn().mockReturnValue({ data: mockPlayersWithRank, isLoading: false }),
      usePlayersComprehensive: jest.fn().mockReturnValue({ data: mockPlayersWithRank, isLoading: false })
    })

    renderWithProviders()
    
    // Should show filter buttons for user interaction
    expect(screen.getByRole('radio', { name: 'Filter by All Batters' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Filter by All Pitchers' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Filter by C' })).toBeInTheDocument()
  })
}) 