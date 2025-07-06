// =============================================================================
// CENTRALIZED TEST MOCKS
// All test files MUST use mocks from this file to avoid duplication
// =============================================================================

import { useSession } from 'next-auth/react'
import { useYahooFantasy } from '@/hooks/use-yahoo-fantasy'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import type { YahooTokens } from '@/types/auth'

// =============================================================================
// MOCK DECLARATIONS - Typed mock references
// =============================================================================
export const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
export const mockUseYahooFantasy = useYahooFantasy as jest.MockedFunction<typeof useYahooFantasy>

// =============================================================================
// MOCK IMPLEMENTATIONS - Direct objects for jest.mock() calls
// =============================================================================
export const nextAuthMock = {
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}

export const yahooFantasyHookMock = {
  useYahooFantasy: jest.fn(),
}

export const nextNavigationMock = {
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null)
  })),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => ''),
}

// Mock window.location for navigation testing
export const mockWindowLocation = {
  href: 'http://localhost/',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
}

// Create axios mock without circular reference
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  defaults: { headers: { common: {} } },
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
}

export const axiosMock = {
  ...mockAxiosInstance,
  create: jest.fn(() => mockAxiosInstance),
}

// =============================================================================
// AUTH-RELATED MOCK DATA
// =============================================================================

// Mock JWT tokens for NextAuth testing
export const mockJWTToken: JWT = {
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  sub: 'test-user-id',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  jti: 'test-jti',
}

export const mockExpiredJWTToken: JWT = {
  ...mockJWTToken,
  expiresAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
}

export const mockJWTTokenWithError: JWT = {
  ...mockJWTToken,
  error: 'RefreshAccessTokenError' as const,
}

// Mock Yahoo OAuth tokens
export const mockYahooTokens: YahooTokens = {
  access_token: 'new-access-token',
  refresh_token: 'new-refresh-token',
  expires_in: 3600,
}

export const mockYahooTokensError = {
  error: 'invalid_grant',
  error_description: 'Invalid refresh token',
}

// Mock NextAuth account data
export const mockAccount = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'Bearer',
  provider: 'yahoo',
  type: 'oauth' as const,
  providerAccountId: 'test-provider-id',
}

// Mock session data for different states
export const mockSessionData = {
  loading: {
    data: null,
    status: 'loading' as const,
    update: jest.fn(),
  },
  unauthenticated: {
    data: null,
    status: 'unauthenticated' as const,
    update: jest.fn(),
  },
  authenticated: {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: 'test-user-id',
      name: 'Test User',
    },
    expires: new Date(Date.now() + 3600000).toISOString(),
  } as Session,
  withError: {
    accessToken: 'expired-token',
    refreshToken: 'test-refresh-token',
    expiresAt: Math.floor(Date.now() / 1000) - 3600,
    error: 'RefreshAccessTokenError' as const,
    user: {
      id: 'test-user-id',
      name: 'Test User',
    },
    expires: new Date(Date.now() - 3600000).toISOString(),
  } as Session,
}

// =============================================================================
// YAHOO API MOCK RESPONSES
// =============================================================================

// Mock Yahoo API success response
export const mockYahooAPIResponse = {
  data: {
    fantasy_content: {
      users: [{ user: [{ profile: { display_name: 'Test User' } }] }]
    }
  },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
}

// Mock Yahoo API error response
export const mockYahooAPIErrorResponse = {
  response: {
    status: 401,
    statusText: 'Unauthorized',
    data: {
      error: {
        description: 'Invalid access token'
      }
    },
    headers: {},
    config: {},
  },
  message: 'Request failed with status code 401',
  name: 'AxiosError',
  isAxiosError: true,
}

// Mock fetch responses for token operations
export const mockFetchSuccessResponse = {
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue(mockYahooTokens),
}

export const mockFetchErrorResponse = {
  ok: false,
  status: 400,
  json: jest.fn().mockResolvedValue(mockYahooTokensError),
}

// =============================================================================
// SETUP FUNCTIONS - Reusable mock configuration
// =============================================================================

export const setupNextAuthMocks = () => {
  const mockSignIn = jest.fn()
  const mockSignOut = jest.fn()
  
  nextAuthMock.signIn = mockSignIn
  nextAuthMock.signOut = mockSignOut
  
  return { mockSignIn, mockSignOut }
}

export const setupFetchMock = () => {
  const originalFetch = global.fetch
  const mockFetch = jest.fn()
  global.fetch = mockFetch
  
  // Cleanup function
  const cleanup = () => {
    global.fetch = originalFetch
  }
  
  return { mockFetch, cleanup }
}

export const setupAxiosMock = () => {
  axiosMock.get.mockClear()
  axiosMock.post.mockClear()
  return axiosMock
}

// =============================================================================
// REQUEST MOCK UTILITIES
// =============================================================================

export const createMockRequest = (overrides: Partial<Request> = {}): Request => {
  const mockRequest = {
    url: 'http://localhost:3000/api/yahoo?endpoint=/test',
    headers: new Headers({
      'Authorization': 'Bearer test-access-token',
      'Content-Type': 'application/json',
    }),
    method: 'GET',
    ...overrides,
  } as Request
  
  return mockRequest
}

export const createMockRequestWithoutAuth = (): Request => {
  return createMockRequest({
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
}

export const createMockRequestWithoutEndpoint = (): Request => {
  return createMockRequest({
    url: 'http://localhost:3000/api/yahoo',
  })
}

// =============================================================================
// YAHOO FANTASY HOOK MOCK UTILITIES
// =============================================================================

export const createYahooFantasyHookReturn = (overrides: Record<string, unknown> = {}) => ({
  useUserInfo: jest.fn().mockReturnValue({ data: null, isLoading: false }),
  usePlayers: jest.fn().mockReturnValue({ data: [], isLoading: false }),
  useGameKey: jest.fn().mockReturnValue({ data: '431', isLoading: false }),
  ...overrides,
})

export const getNextAuthMocks = () => {
  return {
    mockSignIn: nextAuthMock.signIn as jest.Mock,
    mockSignOut: nextAuthMock.signOut as jest.Mock,
    mockUseSession,
  }
}

export const setupNavigationMock = () => {
  // Store original location
  const originalLocation = window.location
  
  // Create a mock location object that captures href assignments
  let capturedHref = originalLocation.href
  
  const mockLocation = {
    ...originalLocation,
    get href() {
      return capturedHref
    },
    set href(url: string) {
      capturedHref = url
    },
    assign: jest.fn((url: string) => {
      capturedHref = url
    }),
    replace: jest.fn((url: string) => {
      capturedHref = url
    }),
    reload: jest.fn(),
  }
  
  // Replace window.location with our mock
  delete (window as unknown as { location: unknown }).location
  window.location = mockLocation as Location
  
  return {
    mockLocation,
    getCapturedHref: () => capturedHref,
    restoreLocation: () => {
      window.location = originalLocation
    }
  }
} 