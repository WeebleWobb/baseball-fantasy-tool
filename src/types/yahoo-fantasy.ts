export interface YahooUserResponse {
  fantasy_content: {
    users: Array<{
      user: Array<{
        profile?: {
          display_name: string;
          fantasy_profile_url: string;
          image_url: string;
        };
      }>;
    }>;
  };
}

export interface YahooGameKey {
  game_key: string;
  game_id: string;
  name: string;
  code: string;
  type: string;
  season: string;
}

export interface YahooGamesResponse {
  fantasy_content: {
    games: Array<{
      game: [YahooGameKey, unknown];
    }>;
  };
}

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
  };
}

// Extended player type with preserved original ranking and current global rank for table display
export type PlayerWithRank = YahooPlayerStats & { 
  originalRank: number;  // Yahoo's original performance ranking (sort=AR order)
  globalRank: number;    // Current position in filtered/searched results
}

export interface YahooPlayersResponse {
  fantasy_content: {
    game: [
      unknown,
      {
        players: {
          count: number;
          [key: string]: {
            player: [
              Array<Record<string, unknown>>,
              {
                player_stats?: {
                  stats: Array<{
                    stat_id: number;
                    value: string | number;
                  }>;
                };
              }
            ];
          } | number;
        };
      }
    ];
  };
} 