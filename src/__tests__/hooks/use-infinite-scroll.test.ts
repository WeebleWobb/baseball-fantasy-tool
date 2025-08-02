import { renderHook, act } from '@testing-library/react'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

describe('useInfiniteScroll', () => {
  let mockOnLoadMore: jest.Mock
  let mockTableContainer: HTMLElement
  let addEventListenerSpy: jest.SpyInstance
  let removeEventListenerSpy: jest.SpyInstance
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockOnLoadMore = jest.fn()
    
    // Mock requestAnimationFrame and cancelAnimationFrame
    global.requestAnimationFrame = jest.fn((callback) => {
      callback(0)
      return 1
    })
    global.cancelAnimationFrame = jest.fn()
    
    // Create mock table container
    mockTableContainer = document.createElement('div')
    mockTableContainer.setAttribute('data-slot', 'table-container')
    Object.defineProperty(mockTableContainer, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 1000
    })
    Object.defineProperty(mockTableContainer, 'scrollTop', {
      writable: true,
      configurable: true,
      value: 0
    })
    Object.defineProperty(mockTableContainer, 'clientHeight', {
      writable: true,
      configurable: true,
      value: 800
    })
    
    // Add container to DOM
    document.body.appendChild(mockTableContainer)
    
    // Spy on container's addEventListener and removeEventListener
    addEventListenerSpy = jest.spyOn(mockTableContainer, 'addEventListener')
    removeEventListenerSpy = jest.spyOn(mockTableContainer, 'removeEventListener')
  })

  afterEach(() => {
    jest.restoreAllMocks()
    // Clean up DOM
    document.body.removeChild(mockTableContainer)
  })

  const setup = (hasMore = true, threshold = 500, dataLength = 25) => {
    return renderHook(() => useInfiniteScroll({
      hasMore,
      onLoadMore: mockOnLoadMore,
      threshold,
      dataLength
    }))
  }

  it('should initialize with correct default values', () => {
    const { result } = setup()
    
    expect(result.current.isNearBottom).toBe(false)
    expect(result.current.loadingMore).toBe(false)
  })

  it('should set up scroll event listener on mount', () => {
    setup()
    
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true }
    )
  })

  it('should clean up event listener on unmount', () => {
    const { unmount } = setup()
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    )
  })

  it('should detect when user is near bottom with default threshold', () => {
    const { result } = setup()
    
    // Simulate scrolling near bottom (within 500px threshold)
    // scrollHeight: 1000, clientHeight: 800, scrollTop: 600
    // distanceFromBottom = 1000 - 600 - 800 = -400 (past bottom, within threshold)
    Object.defineProperty(mockTableContainer, 'scrollTop', {
      value: 600
    })
    
    // Manually call the scroll handler with the new values
    act(() => {
      const scrollHandler = addEventListenerSpy.mock.calls[0][1]
      scrollHandler()
    })
    
    expect(result.current.isNearBottom).toBe(true)
    expect(mockOnLoadMore).toHaveBeenCalled()
  })

  it('should not trigger load more when not near bottom', () => {
    const { result } = setup()
    
    // Test when far from bottom
    Object.defineProperty(mockTableContainer, 'scrollTop', {
      value: 0
    })
    Object.defineProperty(mockTableContainer, 'scrollHeight', {
      value: 2000  // Make page much taller
    })
    // distanceFromBottom = 2000 - 0 - 800 = 1200 (far from 500px threshold)
    
    act(() => {
      const scrollHandler = addEventListenerSpy.mock.calls[0][1]
      scrollHandler()
    })
    
    expect(result.current.isNearBottom).toBe(false)
    expect(mockOnLoadMore).not.toHaveBeenCalled()
  })

  it('should not trigger load more when hasMore is false', () => {
    setup(false) // hasMore = false
    
    // Simulate scrolling near bottom
    Object.defineProperty(mockTableContainer, 'scrollTop', {
      value: 600
    })
    
    act(() => {
      const scrollHandler = addEventListenerSpy.mock.calls[0][1]
      scrollHandler()
    })
    
    expect(mockOnLoadMore).not.toHaveBeenCalled()
  })

  it('should handle basic loading functionality', () => {
    const { result } = setup()
    
    // Test that loading starts as false
    expect(result.current.loadingMore).toBe(false)
    
    // Simulate scrolling near bottom to trigger loading
    Object.defineProperty(mockTableContainer, 'scrollTop', {
      value: 600
    })
    
    act(() => {
      const scrollHandler = addEventListenerSpy.mock.calls[0][1]
      scrollHandler()
    })
    
    // Should call onLoadMore when near bottom
    expect(mockOnLoadMore).toHaveBeenCalled()
    expect(result.current.isNearBottom).toBe(true)
  })

  it('should maintain loading state consistency', () => {
    setup()
    
    // Simulate scrolling near bottom
    Object.defineProperty(mockTableContainer, 'scrollTop', {
      value: 600
    })
    
    // Trigger first scroll event
    act(() => {
      const scrollHandler = addEventListenerSpy.mock.calls[0][1]
      scrollHandler()
    })
    
    expect(mockOnLoadMore).toHaveBeenCalledTimes(1)
    
    // The hook should have some mechanism to prevent multiple rapid calls
    // This is implementation-dependent and may vary
  })

  it('should use requestAnimationFrame for throttling', () => {
    setup()
    
    // Trigger scroll event
    act(() => {
      const scrollHandler = addEventListenerSpy.mock.calls[0][1]
      scrollHandler()
    })
    
    expect(global.requestAnimationFrame).toHaveBeenCalled()
  })

  it('should work with custom threshold', () => {
    const { result } = setup(true, 200) // Custom 200px threshold
    
    // Simulate scrolling within 200px of bottom
    // scrollHeight: 1000, clientHeight: 800, scrollTop: 850
    // distanceFromBottom = 1000 - 850 - 800 = -650 (past bottom, within 200px threshold)
    Object.defineProperty(mockTableContainer, 'scrollTop', {
      value: 850
    })
    
    act(() => {
      const scrollHandler = addEventListenerSpy.mock.calls[0][1]
      scrollHandler()
    })
    
    expect(result.current.isNearBottom).toBe(true)
    expect(mockOnLoadMore).toHaveBeenCalled()
  })

  it('should return correct values in hook return object', () => {
    const { result } = setup()
    
    expect(result.current).toHaveProperty('isNearBottom')
    expect(result.current).toHaveProperty('loadingMore')
    expect(typeof result.current.isNearBottom).toBe('boolean')
    expect(typeof result.current.loadingMore).toBe('boolean')
  })

  it('should prevent race conditions with rapid scroll events', () => {
    const { result } = setup()
    
    // Simulate scrolling near bottom
    Object.defineProperty(mockTableContainer, 'scrollTop', {
      value: 600
    })
    
    // Trigger multiple rapid scroll events before state can update
    act(() => {
      const scrollHandler = addEventListenerSpy.mock.calls[0][1]
      
      // First scroll event
      scrollHandler()
      
      // Immediate second scroll event (before state update)
      scrollHandler()
      
      // Third scroll event (still before state update)
      scrollHandler()
    })
    
    // Should only be called once despite multiple scroll events
    expect(mockOnLoadMore).toHaveBeenCalledTimes(1)
    expect(result.current.loadingMore).toBe(true)
  })
}) 