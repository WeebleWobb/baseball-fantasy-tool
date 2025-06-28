import { useQuery } from '@tanstack/react-query';
import { useSession, signOut } from 'next-auth/react';
import { YahooFantasyAPI } from '@/lib/yahoo-fantasy';

interface UsePlayersOptions {
  season?: string;
  start?: number;
  count?: number;
}

// Cache duration constants in milliseconds
const CACHE_DURATIONS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

export function useYahooFantasy() {
  const { data: session } = useSession();
  const currentYear = new Date().getFullYear().toString();
  
  // Handle token refresh errors
  if (session?.error === 'RefreshAccessTokenError') {
    signOut({ redirect: true, callbackUrl: "/" });
    return {
      useUserInfo: () => ({ data: null, isLoading: false, error: new Error('Session expired') }),
      usePlayers: () => ({ data: null, isLoading: false, error: new Error('Session expired') }),
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
    const { season, start = 0, count = 25 } = options;
    const isCurrentSeason = season === currentYear;

    return useQuery({
      queryKey: ['players', season, start, count],
      queryFn: () => api?.getMLBPlayers({ season, start, count }),
      enabled: !!api,
      // Current season player list updates more frequently
      gcTime: isCurrentSeason ? CACHE_DURATIONS.HOUR : CACHE_DURATIONS.DAY,
      staleTime: isCurrentSeason ? CACHE_DURATIONS.MINUTE * 5 : CACHE_DURATIONS.HOUR,
    });
  };

  return {
    useUserInfo,
    usePlayers,
  };
} 