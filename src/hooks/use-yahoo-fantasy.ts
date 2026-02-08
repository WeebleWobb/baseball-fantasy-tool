import { useQuery } from '@tanstack/react-query';
import { useSession, signOut } from 'next-auth/react';
import { YahooFantasyAPI } from '@/lib/yahoo-fantasy';
import type { UsePlayersOptions } from '@/types/hooks';
import type { YahooPlayerStats } from '@/types/yahoo-fantasy';
import type { UsersResponse } from '@/lib/schemas';
import { useMemo } from 'react';

// Cache duration constants in milliseconds
const CACHE_DURATIONS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;



/**
 * Hook for network performance detection
 */
function useNetworkPerformance(): boolean {
  return useMemo(() => {
    // Only check connection on client side
    if (typeof window === 'undefined') {
      return false; // Default to fast connection during SSR
    }

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
      useUserInfo: () => ({ data: undefined, isLoading: false, error: new Error('Session expired') }),
      usePlayers: () => ({ data: undefined, isLoading: false, error: new Error('Session expired') }),
      usePlayersComprehensive: () => ({ data: undefined, isLoading: false, error: new Error('Session expired') }),
    };
  }

  const api = session?.accessToken ? new YahooFantasyAPI(session.accessToken) : null;

  const useUserInfo = () => {
    return useQuery<UsersResponse | undefined>({
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

    return useQuery<YahooPlayerStats[] | undefined>({
      queryKey: ['players', start, count, playerType],
      queryFn: () => api?.getMLBPlayers({ start, count, playerType }),
      enabled: !!api,
      // Current season player list updates frequently during the season
      gcTime: CACHE_DURATIONS.HOUR,
      staleTime: CACHE_DURATIONS.MINUTE * 5,
    });
  };

  /**
   * Hook for comprehensive dataset loading - simplified approach
   * Key improvements:
   * 1. Remove slow connection disabling (let users decide)
   * 2. Better caching by playerType only (not per filter)
   * 3. Reduce maxPlayers to 200 for better performance
   */
  const usePlayersComprehensive = (options: UsePlayersOptions = {}) => {
    const { playerType = 'ALL_BATTERS', fetchAll = false, statType = 'season', seasonYear = 'current' } = options;

    return useQuery<YahooPlayerStats[] | undefined>({
      queryKey: ['players-comprehensive', playerType, statType, seasonYear],
      queryFn: () => api?.getMLBPlayersComprehensive({
        playerType,
        maxPlayers: isSlowConnection ? 200 : 500,
        statType,
        seasonYear
      }),
      enabled: !!api && fetchAll,
      gcTime: CACHE_DURATIONS.DAY,
      staleTime: CACHE_DURATIONS.HOUR * 4,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
  };

  return {
    useUserInfo,
    usePlayers,
    usePlayersComprehensive,
  };
}
