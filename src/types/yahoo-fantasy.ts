export interface YahooPlayerStats {
  player_key: string;
  name: {
    full: string;
    first: string;
    last: string;
  };
  editorial_team_abbr: string;
  display_position: string;
  player_stats?: {
    stats: Array<{
      stat_id: number;
      value: string | number;
    }>;
    byStatId?: Record<number, string | number>;
  };
}

// Extended player type with preserved original ranking and current global rank for table display
export type PlayerWithRank = YahooPlayerStats & {
  originalRank: number;  // Yahoo's original performance ranking (sort=AR order)
  globalRank: number;    // Current position in filtered/searched results
}
