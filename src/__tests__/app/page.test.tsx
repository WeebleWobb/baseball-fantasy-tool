import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from '@/app/page'
import {
  mockUseSession,
  mockUseYahooFantasy,
  mockSignIn,
  mockSignOut,
  setupAuthenticatedWithData,
  setupLoadingState,
  setupUnauthenticatedState,
  setupEmptyDataState,
  createMockSessionAuthenticated,
  createMockYahooFantasyHook,
} from '@/__tests__/utils/test-mocks'

// Alias for clearer test readability
const setupAuthenticatedMocks = setupAuthenticatedWithData

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('@/hooks/use-yahoo-fantasy', () => ({
  useYahooFantasy: jest.fn(),
}))

jest.mock('@/lib/season-state', () => ({
  getStoredSeason: jest.fn(() => 'current'),
  saveSeason: jest.fn(),
  getStoredTimePeriod: jest.fn(() => 'full'),
  saveTimePeriod: jest.fn(),
  deriveStatType: jest.fn(() => 'season'),
}))

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: mockPush, replace: jest.fn() })),
  usePathname: jest.fn(() => '/'),
}))

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
    setupLoadingState()

    renderWithProviders()

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should display user interface when authenticated and data is loaded', () => {
    setupAuthenticatedMocks()

    renderWithProviders()

    expect(screen.getByText(/Test User/)).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
    expect(screen.getByText('Mike Trout')).toBeInTheDocument()
    expect(screen.getByText('T')).toBeInTheDocument() // Avatar fallback
  })

  it('should handle empty players data', () => {
    setupEmptyDataState()

    renderWithProviders()

    expect(screen.getByText('No results.')).toBeInTheDocument()
  })

  it('should handle missing user data with fallbacks', () => {
    mockUseSession.mockReturnValue(createMockSessionAuthenticated())
    mockUseYahooFantasy.mockReturnValue(createMockYahooFantasyHook({
      useUserInfo: jest.fn().mockReturnValue({
        data: {
          fantasy_content: {
            users: [{
              user: [{}, { profile: {} }]
            }]
          }
        },
        isLoading: false
      }),
      usePlayers: jest.fn().mockReturnValue({ data: [], isLoading: false })
    }))

    renderWithProviders()

    expect(screen.getByText('Welcome, User')).toBeInTheDocument()
    expect(screen.getByText('U')).toBeInTheDocument()
  })

  it('should handle sign-in button click when not authenticated', () => {
    setupUnauthenticatedState()

    renderWithProviders()

    const signInButton = screen.getByRole('button', { name: /sign in with yahoo/i })
    fireEvent.click(signInButton)

    expect(mockSignIn).toHaveBeenCalledWith('yahoo', { callbackUrl: '/' })
  })

  it('should handle sign-out button click when authenticated', () => {
    setupAuthenticatedMocks()

    renderWithProviders()

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutButton)

    expect(mockSignOut).toHaveBeenCalledWith({ redirect: true, callbackUrl: "/" })
  })

  it('should navigate to home when Players button clicked', () => {
    setupAuthenticatedMocks()

    renderWithProviders()

    const playersButton = screen.getByRole('button', { name: /players/i })
    fireEvent.click(playersButton)

    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('should display filter buttons for user interaction', () => {
    setupAuthenticatedMocks()

    renderWithProviders()

    expect(screen.getByRole('radio', { name: 'Filter by All Batters' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Filter by All Pitchers' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Filter by C' })).toBeInTheDocument()
  })
}) 