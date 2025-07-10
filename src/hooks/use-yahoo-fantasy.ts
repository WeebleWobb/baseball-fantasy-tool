import { useQuery } from '@tanstack/react-query';
import { useSession, signOut } from 'next-auth/react';
import { YahooFantasyAPI } from '@/lib/yahoo-fantasy';
import type { UsePlayersOptions } from '@/types/hooks';
import { useMemo } from 'react';

// Cache duration constants in milliseconds
const CACHE_DURATIONS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Simple network performance detection
 * Returns true if connection appears to be slow
 */
function useNetworkPerformance(): boolean {
  return useMemo(() => {
    // Check if we're on a slow connection
    if ('connection' in navigator) {
      const connection = (navigator as Record<string, unknown>).connection;
      if (connection && typeof connection === 'object' && 'effectiveType' in connection) {
        const effectiveType = connection.effectiveType;
        // Consider 2G or slow-2g as slow connections
        return effectiveType === '2g' || effectiveType === 'slow-2g';
      }
    }
    return false; // Default to fast connection
  }, []);
}

export function useYahooFantasy() {
  const { data: session } = useSession();
  const isSlowConnection = useNetworkPerformance();
  
  // Handle token refresh errors
  if (session?.error === 'RefreshAccessTokenError') {
    signOut({ redirect: true, callbackUrl: "/" });
    return {
      useUserInfo: () => ({ data: null, isLoading: false, error: new Error('Session expired') }),
      usePlayers: () => ({ data: null, isLoading: false, error: new Error('Session expired') }),
      usePlayersComprehensive: () => ({ data: null, isLoading: false, error: new Error('Session expired') }),
    };
  }

  const api = session?.accessToken ? new YahooFantasyAPI(session.accessToken) : null;

  const useUserInfo = () => {
    return useQuery({
      queryKey: ['user-info'],
      queryFn: () => api?.getUserInfo(),
      enabled: !!api,
      // User info can be cached longer as it rarely changes
      gcTime: CACHE_DURATIONS.DAY,
      staleTime: CACHE_DURATIONS.HOUR,
    });
  };

  const usePlayers = (options: UsePlayersOptions = {}) => {
    const { start = 0, count = 25, playerType = 'ALL_BATTERS' } = options;

    return useQuery({
      queryKey: ['players', start, count, playerType],
      queryFn: () => api?.getMLBPlayers({ start, count, playerType }),
      enabled: !!api,
      // Current season player list updates frequently during the season
      gcTime: CACHE_DURATIONS.HOUR,
      staleTime: CACHE_DURATIONS.MINUTE * 5,
    });
  };

  /**
   * Hook for comprehensive dataset loading - fetches large datasets for position-based filtering
   * Uses enhanced caching strategy and adaptive loading based on network performance
   */
  const usePlayersComprehensive = (options: UsePlayersOptions = {}) => {
    const { playerType = 'ALL_BATTERS', fetchAll = false } = options;

    // Adaptive loading: disable comprehensive loading on slow connections
    const shouldFetchAll = fetchAll && !isSlowConnection;

    return useQuery({
      queryKey: ['players-comprehensive', playerType, shouldFetchAll],
      queryFn: () => api?.getMLBPlayersComprehensive({ 
        playerType,
        // Reduce dataset size on slow connections
        maxPlayers: isSlowConnection ? 200 : 500
      }),
      enabled: !!api && shouldFetchAll,
      // Enhanced caching for comprehensive dataset
      gcTime: CACHE_DURATIONS.DAY, // 24-hour cache
      staleTime: CACHE_DURATIONS.HOUR * 4, // 4-hour stale time
      // Reduce refetch frequency for large datasets
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // Retry configuration for better reliability
      retry: (failureCount) => {
        // Don't retry on slow connections after first failure
        if (isSlowConnection && failureCount >= 1) return false;
        // Normal retry logic for fast connections
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
  };

  return {
    useUserInfo,
    usePlayers,
    usePlayersComprehensive,
  };
} 