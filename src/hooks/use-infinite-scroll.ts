'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { InfiniteScrollHookReturn } from '@/types/player-data'

interface UseInfiniteScrollProps {
  hasMore: boolean
  onLoadMore: () => void
  threshold?: number
  dataLength?: number
}

export function useInfiniteScroll({
  hasMore,
  onLoadMore,
  threshold = 500,
  dataLength = 0
}: UseInfiniteScrollProps): InfiniteScrollHookReturn {
  const [isNearBottom, setIsNearBottom] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  
  // Use ref for synchronous access to loading state to prevent race conditions
  const loadingRef = useRef(false)
  const previousDataLengthRef = useRef(dataLength)
  const onLoadMoreRef = useRef(onLoadMore)
  const containerRef = useRef<HTMLElement | null>(null)

  const getTableContainer = () => document.querySelector('[data-slot="table-container"]') as HTMLElement

  // Keep onLoadMore ref synchronized with latest function
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  const handleScroll = useCallback(() => {
    if (!hasMore || loadingRef.current) return
    
    const tableContainer = containerRef.current || getTableContainer()
    
    if (!tableContainer) return
    
    if (!containerRef.current) {
      containerRef.current = tableContainer
    }
    
    const scrollHeight = tableContainer.scrollHeight
    const scrollTop = tableContainer.scrollTop
    const clientHeight = tableContainer.clientHeight
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    const nearBottom = distanceFromBottom <= threshold
    
    setIsNearBottom(nearBottom)
    
    if (nearBottom) {
      loadingRef.current = true
      setLoadingMore(true)
      onLoadMoreRef.current()
    }
  }, [hasMore, threshold])

  // Reset loading state when all data is loaded
  useEffect(() => {
    if (!hasMore) {
      loadingRef.current = false
      setLoadingMore(false)
    }
  }, [hasMore])

  // Reset loading state when new data arrives
  useEffect(() => {
    if (dataLength > previousDataLengthRef.current && loadingRef.current) {
      loadingRef.current = false
      setLoadingMore(false)
    }
    previousDataLengthRef.current = dataLength
  }, [dataLength])

  // Set up scroll event listeners with throttling
  useEffect(() => {
    let rafId: number | null = null
    let isScrolling = false

    const throttledScrollHandler = () => {
      if (!isScrolling) {
        isScrolling = true
        rafId = requestAnimationFrame(() => {
          handleScroll()
          isScrolling = false
        })
      }
    }

    const scrollableContainer = getTableContainer()
    
    if (!scrollableContainer) return
    
    // Cache the container for scroll handling optimization
    if (!containerRef.current) {
      containerRef.current = scrollableContainer
    }
    
    scrollableContainer.addEventListener('scroll', throttledScrollHandler, { passive: true })

    return () => {
      scrollableContainer.removeEventListener('scroll', throttledScrollHandler)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      // Clear container cache on cleanup
      containerRef.current = null
    }
  }, [handleScroll])

  return {
    isNearBottom,
    loadingMore
  }
} 