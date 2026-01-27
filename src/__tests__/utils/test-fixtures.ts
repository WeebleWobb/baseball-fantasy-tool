import { BATTING_STAT_IDS, PITCHING_STAT_IDS } from '@/lib/constants'
import type { YahooPlayerStats, PlayerWithRank } from '@/types/yahoo-fantasy'

// Mock User Data (matches real Yahoo API structure with numeric keys)
export const mockUserInfo = {
  fantasy_content: {
    users: {
      count: 1,
      "0": {
        user: [
          { guid: 'test-user-guid' },
          {
            profile: {
              display_name: 'Test User',
              fantasy_profile_url: 'https://example.com',
              image_url: 'https://example.com/avatar.jpg'
            }
          }
        ]
      }
    }
  }
}

// Mock Player Stats Data
export const mockPlayerStats = {
  miketrout: [
    { stat_id: BATTING_STAT_IDS.HITS, value: 150 },
    { stat_id: BATTING_STAT_IDS.AT_BATS, value: 500 },
    { stat_id: BATTING_STAT_IDS.HOME_RUNS, value: 35 },
    { stat_id: BATTING_STAT_IDS.RBI, value: 100 },
    { stat_id: BATTING_STAT_IDS.RUNS, value: 90 },
    { stat_id: BATTING_STAT_IDS.STOLEN_BASES, value: 15 }
  ],
  mookiebetts: [
    { stat_id: BATTING_STAT_IDS.HITS, value: 140 },
    { stat_id: BATTING_STAT_IDS.AT_BATS, value: 480 },
    { stat_id: BATTING_STAT_IDS.HOME_RUNS, value: 28 },
    { stat_id: BATTING_STAT_IDS.RBI, value: 95 },
    { stat_id: BATTING_STAT_IDS.RUNS, value: 85 },
    { stat_id: BATTING_STAT_IDS.STOLEN_BASES, value: 25 }
  ],
  rookieplayer: [
    { stat_id: BATTING_STAT_IDS.HITS, value: 45 },
    { stat_id: BATTING_STAT_IDS.AT_BATS, value: 200 },
    // Missing some stats to test edge cases
  ]
}

// Mock Pitcher Stats Data
export const mockPitcherStats = {
  jacobdegrom: [
    { stat_id: PITCHING_STAT_IDS.INNINGS_PITCHED, value: 180.2 },
    { stat_id: PITCHING_STAT_IDS.ERA, value: 2.54 },
    { stat_id: PITCHING_STAT_IDS.WHIP, value: 1.08 },
    { stat_id: PITCHING_STAT_IDS.WINS, value: 15 },
    { stat_id: PITCHING_STAT_IDS.STRIKEOUTS, value: 220 },
    { stat_id: PITCHING_STAT_IDS.SAVES, value: 0 }
  ],
  edwindiaz: [
    { stat_id: PITCHING_STAT_IDS.INNINGS_PITCHED, value: 62.0 },
    { stat_id: PITCHING_STAT_IDS.ERA, value: 1.31 },
    { stat_id: PITCHING_STAT_IDS.WHIP, value: 0.84 },
    { stat_id: PITCHING_STAT_IDS.WINS, value: 3 },
    { stat_id: PITCHING_STAT_IDS.STRIKEOUTS, value: 118 },
    { stat_id: PITCHING_STAT_IDS.SAVES, value: 39 },
    { stat_id: PITCHING_STAT_IDS.BLOWN_SAVES, value: 2 }
  ]
}

// Mock Players
export const mockPlayers: YahooPlayerStats[] = [
  {
    player_key: '431.p.8967',
    name: { full: 'Mike Trout', first: 'Mike', last: 'Trout' },
    editorial_team_abbr: 'LAA',
    display_position: 'OF',
    player_stats: {
      stats: mockPlayerStats.miketrout
    }
  },
  {
    player_key: '431.p.9988',
    name: { full: 'Mookie Betts', first: 'Mookie', last: 'Betts' },
    editorial_team_abbr: 'LAD',
    display_position: '2B,OF',
    player_stats: {
      stats: mockPlayerStats.mookiebetts
    }
  },
  {
    player_key: '431.p.1234',
    name: { full: 'Rookie Player', first: 'Rookie', last: 'Player' },
    editorial_team_abbr: 'NYY',
    display_position: '1B',
    player_stats: {
      stats: mockPlayerStats.rookieplayer
    }
  }
]

// Mock Players with Rank (for DataTable tests)
export const mockPlayersWithRank: PlayerWithRank[] = mockPlayers.map((player, index) => ({
  ...player,
  originalRank: index + 1,
  globalRank: index + 1
}))

// Mock Pitcher Players
export const mockPitchers: YahooPlayerStats[] = [
  {
    player_key: '431.p.7163',
    name: { full: 'Jacob deGrom', first: 'Jacob', last: 'deGrom' },
    editorial_team_abbr: 'TEX',
    display_position: 'SP',
    player_stats: {
      stats: mockPitcherStats.jacobdegrom
    }
  },
  {
    player_key: '431.p.8204',
    name: { full: 'Edwin Diaz', first: 'Edwin', last: 'Diaz' },
    editorial_team_abbr: 'NYM',
    display_position: 'RP',
    player_stats: {
      stats: mockPitcherStats.edwindiaz
    }
  }
]

// Mock Pitchers with Rank (for DataTable tests)
export const mockPitchersWithRank: PlayerWithRank[] = mockPitchers.map((player, index) => ({
  ...player,
  originalRank: index + 1,
  globalRank: index + 1
}))

// Game info for players response
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

// Helper to wrap stats in Yahoo's { stat: {...} } format
const wrapStats = (stats: Array<{ stat_id: number; value: string | number }>) =>
  stats.map(s => ({ stat: { stat_id: String(s.stat_id), value: s.value } }));

// Mock API Response (matches real Yahoo API structure)
export const mockPlayersResponse = {
  fantasy_content: {
    game: [
      mockGameInfo,
      {
        players: {
          count: 2,
          "0": {
            player: [
              [
                { player_key: mockPlayers[0].player_key },
                { name: mockPlayers[0].name },
                { editorial_team_abbr: mockPlayers[0].editorial_team_abbr },
                { display_position: mockPlayers[0].display_position }
              ],
              {
                player_stats: {
                  stats: wrapStats(mockPlayers[0].player_stats?.stats || [])
                }
              }
            ]
          },
          "1": {
            player: [
              [
                { player_key: mockPlayers[1].player_key },
                { name: mockPlayers[1].name },
                { editorial_team_abbr: mockPlayers[1].editorial_team_abbr },
                { display_position: mockPlayers[1].display_position }
              ],
              {
                player_stats: {
                  stats: wrapStats(mockPlayers[1].player_stats?.stats || [])
                }
              }
            ]
          }
        }
      }
    ]
  }
}

// Edge Case Test Data
export const mockMalformedPlayer: PlayerWithRank = {
  player_key: '431.p.bad',
  name: { full: 'Bad Player', first: 'Bad', last: 'Player' },
  editorial_team_abbr: '',
  display_position: '',
  originalRank: 999,
  globalRank: 999,
  player_stats: undefined // No stats at all
}

export const mockPartialStatsPlayer: PlayerWithRank = {
  player_key: '431.p.partial',
  name: { full: 'Partial Stats', first: 'Partial', last: 'Stats' },
  editorial_team_abbr: 'TEX',
  display_position: 'SS',
  originalRank: 200,
  globalRank: 200,
  player_stats: {
    stats: [
      { stat_id: BATTING_STAT_IDS.HITS, value: 75 },
      // Missing most other stats
    ]
  }
}

export const mockNoAtBatsPlayer: PlayerWithRank = {
  player_key: '431.p.zero',
  name: { full: 'Zero AB', first: 'Zero', last: 'AB' },
  editorial_team_abbr: 'MIA',
  display_position: 'C',
  originalRank: 500,
  globalRank: 500,
  player_stats: {
    stats: [
      { stat_id: BATTING_STAT_IDS.HITS, value: 10 },
      { stat_id: BATTING_STAT_IDS.AT_BATS, value: 0 }, // Zero at bats
    ]
  }
}

// Utility functions for creating test data
export const createMockPlayer = (overrides: Partial<YahooPlayerStats> = {}): YahooPlayerStats => ({
  player_key: '431.p.test',
  name: { full: 'Test Player', first: 'Test', last: 'Player' },
  editorial_team_abbr: 'TEST',
  display_position: 'OF',
  player_stats: {
    stats: [
      { stat_id: BATTING_STAT_IDS.HITS, value: 100 },
      { stat_id: BATTING_STAT_IDS.AT_BATS, value: 400 }
    ]
  },
  ...overrides
})

export const createMockPlayerWithRank = (overrides: Partial<PlayerWithRank> = {}): PlayerWithRank => ({
  ...createMockPlayer(overrides),
  originalRank: 50,
  globalRank: 50,
  ...overrides
})

// Mock Game Response (matches real Yahoo API structure with numeric keys)
export const mockGameResponse = {
  fantasy_content: {
    games: {
      count: 1,
      "0": {
        game: [
          {
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
          }
        ]
      }
    }
  }
}

// Mock Session Data (for hook tests)
export const mockSessionData = {
  authenticated: {
    accessToken: 'test-access-token',
    user: { name: 'Test User' },
    expires: '2024-12-31',
  },
  unauthenticated: null,
  withError: {
    error: 'RefreshAccessTokenError',
    accessToken: 'expired-token',
    user: { name: 'Test User' },
    expires: '2024-12-31',
  }
}

// Simplified mock players for hook tests (minimal data)
export const mockPlayersSimple: YahooPlayerStats[] = [
  {
    player_key: '431.p.8967',
    name: { full: 'Mike Trout', first: 'Mike', last: 'Trout' },
    editorial_team_abbr: 'LAA',
    display_position: 'OF',
    player_stats: { stats: [] }
  }
]

// Mock Yahoo API error responses for API route testing
export const mockYahooAPIErrorData = {
  error: {
    description: 'Invalid access token',
    detail: 'Token has expired'
  }
}

export const mockGenericErrorData = {
  error: 'An unexpected error occurred'
}

// Mock successful Yahoo API response data (matches real structure)
export const mockYahooAPISuccessData = {
  fantasy_content: {
    users: {
      count: 1,
      "0": {
        user: [
          { guid: 'test-user-guid' },
          {
            profile: {
              display_name: 'Test User',
              fantasy_profile_url: 'https://example.com',
              image_url: 'https://example.com/avatar.jpg'
            }
          }
        ]
      }
    }
  }
} 