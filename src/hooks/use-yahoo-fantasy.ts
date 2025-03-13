import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { YahooFantasyAPI } from '@/lib/yahoo-fantasy';

export function useYahooFantasy() {
  const { data: session } = useSession();
  const api = session?.accessToken ? new YahooFantasyAPI(session.accessToken) : null;

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
    usePlayers,
    usePlayerStats,
    usePlayerComparison,
  };
} 