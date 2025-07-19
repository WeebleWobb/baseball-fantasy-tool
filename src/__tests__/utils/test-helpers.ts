import type { YahooPlayersResponse } from '@/types/yahoo-fantasy'

/**
 * Helper function to create mock Yahoo Players API response
 * @param count - Number of players in the response
 * @param playerData - Array of player data objects
 * @returns Properly formatted YahooPlayersResponse
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
}>): YahooPlayersResponse => {
  const players: YahooPlayersResponse['fantasy_content']['game'][1]['players'] = { count };
  
  playerData.forEach((player, index) => {
    players[index.toString()] = {
      player: [
        [
          { player_key: player.player_key },
          { name: player.name },
          { editorial_team_abbr: player.editorial_team_abbr },
          { display_position: player.display_position }
        ],
        {
          player_stats: player.player_stats
        }
      ]
    };
  });

  return {
    fantasy_content: {
      game: [
        {},
        { players }
      ]
    }
  };
};

/**
 * Helper function to create empty Yahoo Players API response
 * @returns Empty YahooPlayersResponse with count: 0
 */
export const createEmptyPlayersResponse = (): YahooPlayersResponse => ({
  fantasy_content: {
    game: [
      {},
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