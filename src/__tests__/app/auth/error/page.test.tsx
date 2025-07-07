import { render, screen, fireEvent } from '@testing-library/react'
import AuthError from '@/app/auth/error/page'
import { useRouter } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null)
  })),
  useRouter: jest.fn(),
  usePathname: jest.fn(() => ''),
}))

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('AuthError Page', () => {
  const setup = () => {
    // Setup the mock router before each test
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as ReturnType<typeof useRouter>)
    
    render(<AuthError />)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the authentication error page', () => {        
    setup()

    expect(screen.getByText('There was a problem signing you in.')).toBeInTheDocument()
  })

  it('should navigate to /auth/signin when try again button is clicked', () => {
    setup()

    const tryAgainButton = screen.getByRole('button', { name: 'Try Again' })
    fireEvent.click(tryAgainButton)

    expect(mockPush).toHaveBeenCalledWith('/auth/signin')
  })
})