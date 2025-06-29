import { YahooPlayerStats } from '@/types/yahoo-fantasy';

interface PlayerStatsCellProps {
  player: YahooPlayerStats;
  statId: number;
  format?: (value: string | number) => string;
}

export function PlayerStatsCell({ player, statId, format }: PlayerStatsCellProps) {
  // Get the stat value from the player's stats array
  const value = player.player_stats?.stats?.find(s => s.stat_id === statId)?.value;
  
  if (format && value !== undefined && value !== null) {
    return <span>{format(value)}</span>;
  }
  
  return <span>{value === undefined || value === null ? '0' : value.toString()}</span>;
}
