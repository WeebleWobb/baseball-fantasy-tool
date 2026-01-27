// Game info for players response (matches real Yahoo API)
const mockGameInfo = {
  game_key: '431',
  game_id: '431',
  name: 'Baseball',
  code: 'mlb',
  type: 'full',
  url: 'https://baseball.fantasysports.yahoo.com/b1',
  season: '2025',
  is_registration_over: 0,
  is_game_over: 0,
  is_offseason: 0
};

/**
 * Helper function to create mock Yahoo Players API response
 * Matches real Yahoo API structure with wrapped stats
 * @param count - Number of players in the response
 * @param playerData - Array of player data objects
 * @returns Properly formatted players response structure
 */
export const createMockPlayersResponse = (count: number, playerData: Array<{
  player_key: string;
  name: { full: string; first: string; last: string };
  editorial_team_abbr: string;
  display_position: string;
  player_stats?: {
    stats: Array<{
      stat_id: number;
      value: string | number;
    }>;
  };
}>) => {
  const players: Record<string, unknown> = { count };

  playerData.forEach((player, index) => {
    // Wrap stats in { stat: {...} } format like real Yahoo API
    const wrappedStats = player.player_stats?.stats.map(s => ({
      stat: { stat_id: String(s.stat_id), value: s.value }
    })) || [];

    players[index.toString()] = {
      player: [
        [
          { player_key: player.player_key },
          { name: player.name },
          { editorial_team_abbr: player.editorial_team_abbr },
          { display_position: player.display_position }
        ],
        {
          player_stats: {
            stats: wrappedStats
          }
        }
      ]
    };
  });

  return {
    fantasy_content: {
      game: [
        mockGameInfo,
        { players }
      ]
    }
  };
};

/**
 * Helper function to create empty Yahoo Players API response
 * @returns Empty players response with count: 0
 */
export const createEmptyPlayersResponse = () => ({
  fantasy_content: {
    game: [
      mockGameInfo,
      { players: { count: 0 } }
    ]
  }
});

/**
 * Helper function to create mock player data for testing
 * @param overrides - Partial player data to override defaults
 * @returns Mock player data object
 */
export const createMockPlayerData = (overrides: Partial<{
  player_key: string;
  name: { full: string; first: string; last: string };
  editorial_team_abbr: string;
  display_position: string;
  player_stats?: {
    stats: Array<{
      stat_id: number;
      value: string | number;
    }>;
  };
}> = {}) => ({
  player_key: '431.p.test',
  name: { full: 'Test Player', first: 'Test', last: 'Player' },
  editorial_team_abbr: 'TEST',
  display_position: 'OF',
  player_stats: { stats: [] },
  ...overrides
});
