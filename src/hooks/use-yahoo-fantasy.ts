import { useQuery } from '@tanstack/react-query';
import { useSession, signOut } from 'next-auth/react';
import { YahooFantasyAPI } from '@/lib/yahoo-fantasy';

export function useYahooFantasy() {
  const { data: session } = useSession();
  
  // Handle token refresh errors
  if (session?.error === 'RefreshAccessTokenError') {
    signOut({ redirect: true, callbackUrl: "/" });
    return {
      useUserInfo: () => ({ data: null, isLoading: false, error: new Error('Session expired') }),
      usePlayers: () => ({ data: null, isLoading: false, error: new Error('Session expired') }),
      usePlayerStats: () => ({ data: null, isLoading: false, error: new Error('Session expired') }),
      usePlayerComparison: () => ({ data: null, isLoading: false, error: new Error('Session expired') }),
    };
  }

  const api = session?.accessToken ? new YahooFantasyAPI(session.accessToken) : null;

  const useUserInfo = () => {
    return useQuery({
      queryKey: ['user-info'],
      queryFn: () => api?.getUserInfo(),
      enabled: !!api,
    });
  };

  const usePlayers = (start: number = 0, count: number = 25) => {
    return useQuery({
      queryKey: ['players', start, count],
      queryFn: () => api?.getMLBPlayers(start, count),
      enabled: !!api,
    });
  };

  const usePlayerStats = (playerId: string) => {
    return useQuery({
      queryKey: ['player-stats', playerId],
      queryFn: () => api?.getPlayerStats(playerId),
      enabled: !!api,
    });
  };

  const usePlayerComparison = (playerIds: string[]) => {
    return useQuery({
      queryKey: ['player-comparison', playerIds],
      queryFn: () => api?.comparePlayerStats(playerIds),
      enabled: !!api && playerIds.length > 0,
    });
  };

  return {
    useUserInfo,
    usePlayers,
    usePlayerStats,
    usePlayerComparison,
  };
} 