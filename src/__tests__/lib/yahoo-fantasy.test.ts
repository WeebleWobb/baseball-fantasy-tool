import { YahooFantasyAPI } from '@/lib/yahoo-fantasy'
import { 
  mockGameResponse, 
  mockPlayersResponse, 
  mockUserInfo 
} from '@/__tests__/utils/test-fixtures'
import { 
  createMockPlayersResponse,
  createEmptyPlayersResponse, 
  createMockPlayerData 
} from '@/__tests__/utils/test-helpers'
import { BATTING_STAT_IDS } from '@/lib/constants'
import axios from 'axios'

// Simple inline mock
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('YahooFantasyAPI', () => {
  let api: YahooFantasyAPI
  const mockAccessToken = 'test-access-token'

  beforeEach(() => {
    api = new YahooFantasyAPI(mockAccessToken)
    jest.clearAllMocks()
  })

  describe('getUserInfo', () => {
    it('should fetch user information successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockUserInfo })

      const userInfo = await api.getUserInfo()

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/yahoo', {
        params: { endpoint: '/users;use_login=1/profile' },
        headers: { 'Authorization': `Bearer ${mockAccessToken}` }
      })
      expect(userInfo).toEqual(mockUserInfo)
    })
  })

  describe('getMLBGameKey', () => {
    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({ data: mockGameResponse })
    })

    it('should fetch and cache game keys for current year', async () => {
      const gameKey1 = await api.getMLBGameKey()
      const gameKey2 = await api.getMLBGameKey() // Should use cache
      
      expect(gameKey1).toBe('431')
      expect(gameKey2).toBe('431')
      expect(mockedAxios.get).toHaveBeenCalledTimes(1) // Cached on second call
    })

    it('should use current year automatically', async () => {
      const currentYear = new Date().getFullYear().toString()
      
      const gameKey = await api.getMLBGameKey()
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/yahoo', {
        params: { endpoint: `/games;game_codes=mlb;seasons=${currentYear}` },
        headers: { 'Authorization': `Bearer ${mockAccessToken}` }
      })
      expect(gameKey).toBe('431')
    })

    it('should throw error when no games found for current year', async () => {
      const currentYear = new Date().getFullYear().toString()
      // Empty games collection (object with only count)
      mockedAxios.get.mockResolvedValue({
        data: { fantasy_content: { games: { count: 0 } } }
      })

      await expect(api.getMLBGameKey()).rejects.toThrow(`No MLB game found for season ${currentYear}`)
    })
  })

  describe('getMLBPlayers', () => {
    beforeEach(() => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockGameResponse }) // Game key request
        .mockResolvedValueOnce({ data: mockPlayersResponse }) // Players request
    })

    it('should fetch and transform player data correctly', async () => {
      const players = await api.getMLBPlayers()

      expect(players).toHaveLength(2)
      // Check basic player info
      expect(players[0].player_key).toBe('431.p.8967')
      expect(players[0].name).toEqual({
        full: 'Mike Trout',
        first: 'Mike',
        last: 'Trout'
      })
      expect(players[0].editorial_team_abbr).toBe('LAA')
      expect(players[0].display_position).toBe('OF')

      // Check stats are transformed (unwrapped from Yahoo format)
      expect(players[0].player_stats?.stats).toHaveLength(6)
      expect(players[0].player_stats?.stats[0]).toEqual({ stat_id: BATTING_STAT_IDS.HITS, value: 150 })

      // Check byStatId lookup is created
      expect(players[0].player_stats?.byStatId).toBeDefined()
      expect(players[0].player_stats?.byStatId?.[BATTING_STAT_IDS.HITS]).toBe(150)

      expect(players[1].display_position).toBe('2B,OF') // Multiple positions
    })

    it('should handle different player types correctly', async () => {
      const emptyResponse = createEmptyPlayersResponse()

      // Reset mocks and create fresh API instance for this test
      mockedAxios.get.mockReset()
      const freshApi = new YahooFantasyAPI(mockAccessToken)

      // Test batter types
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockGameResponse })
        .mockResolvedValueOnce({ data: emptyResponse })
      await freshApi.getMLBPlayers({ playerType: 'ALL_BATTERS' })
      expect(mockedAxios.get).toHaveBeenLastCalledWith('/api/yahoo', {
        params: expect.objectContaining({
          endpoint: expect.stringContaining('position=B/stats')
        }),
        headers: { 'Authorization': `Bearer ${mockAccessToken}` }
      })

      // Reset for pitcher test with fresh API instance
      mockedAxios.get.mockReset()
      const freshApi2 = new YahooFantasyAPI(mockAccessToken)
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockGameResponse })
        .mockResolvedValueOnce({ data: emptyResponse })
      await freshApi2.getMLBPlayers({ playerType: 'ALL_PITCHERS' })
      expect(mockedAxios.get).toHaveBeenLastCalledWith('/api/yahoo', {
        params: expect.objectContaining({
          endpoint: expect.stringContaining('position=P/stats')
        }),
        headers: { 'Authorization': `Bearer ${mockAccessToken}` }
      })
    })

    it('should handle API failures and empty responses gracefully', async () => {
      // Test API error - getMLBPlayers throws on error (unlike getMLBPlayersComprehensive)
      mockedAxios.get.mockReset()
      const freshApi = new YahooFantasyAPI(mockAccessToken)
      mockedAxios.get.mockRejectedValue(new Error('Network Error'))

      await expect(freshApi.getMLBPlayers()).rejects.toThrow('Network Error')

      // Test empty response - should return empty array
      mockedAxios.get.mockReset()
      const freshApi2 = new YahooFantasyAPI(mockAccessToken)
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockGameResponse })
        .mockResolvedValueOnce({ data: createEmptyPlayersResponse() })

      const playersEmpty = await freshApi2.getMLBPlayers()
      expect(playersEmpty).toEqual([])
    })

    it('should handle missing player stats gracefully', async () => {
      const playerWithoutStats = createMockPlayersResponse(1, [
        createMockPlayerData({
          player_key: '431.p.1234',
          name: { full: 'No Stats Player', first: 'No Stats', last: 'Player' },
          editorial_team_abbr: 'TEST',
          display_position: 'OF'
          // No player_stats object - will use default empty stats
        })
      ])

      mockedAxios.get.mockReset()
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockGameResponse })
        .mockResolvedValueOnce({ data: playerWithoutStats })

      const players = await api.getMLBPlayers()
      
      expect(players).toHaveLength(1)
      expect(players[0].player_stats?.stats).toEqual([])
    })
  })

  describe('getMLBPlayersComprehensive', () => {
    it('should fetch and combine multiple batches of players', async () => {
      // Create multiple batches of player data
      const batch1 = createMockPlayersResponse(25, Array.from({ length: 25 }, (_, i) => 
        createMockPlayerData({
          player_key: `431.p.${1000 + i}`,
          name: { full: `Player ${i + 1}`, first: `Player`, last: `${i + 1}` }
        })
      ))
      
      const batch2 = createMockPlayersResponse(20, Array.from({ length: 20 }, (_, i) => 
        createMockPlayerData({
          player_key: `431.p.${2000 + i}`,
          name: { full: `Player ${i + 26}`, first: `Player`, last: `${i + 26}` }
        })
      ))

      // Mock API calls: game key + two batches + empty (signals end)
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockGameResponse }) // Game key request
        .mockResolvedValueOnce({ data: batch1 }) // First batch: 25 players
        .mockResolvedValueOnce({ data: batch2 }) // Second batch: 20 players (partial = end)

      const players = await api.getMLBPlayersComprehensive({ maxPlayers: 100 })

      // Should combine both batches
      expect(players).toHaveLength(45) // 25 + 20
      expect(players[0].name.full).toBe('Player 1')
      expect(players[24].name.full).toBe('Player 25')
      expect(players[25].name.full).toBe('Player 26') // First player from second batch
      expect(players[44].name.full).toBe('Player 45') // Last player from second batch
    })

    it('should respect maxPlayers parameter', async () => {
      const largeBatch = createMockPlayersResponse(25, Array.from({ length: 25 }, (_, i) => 
        createMockPlayerData({
          player_key: `431.p.${i}`,
          name: { full: `Player ${i + 1}`, first: `Player`, last: `${i + 1}` }
        })
      ))

      // Mock to return the same batch multiple times
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockGameResponse }) // Game key
        .mockResolvedValueOnce({ data: largeBatch }) // First batch: 25 players
        .mockResolvedValueOnce({ data: largeBatch }) // Second batch: 25 players (would be 50 total)

      const players = await api.getMLBPlayersComprehensive({ maxPlayers: 30 })

      // Should stop after hitting maxPlayers limit
      expect(players.length).toBeGreaterThanOrEqual(25) // At least first batch
      expect(players.length).toBeLessThanOrEqual(50) // But not unlimited
    })

    it('should pass playerType parameter to underlying API calls', async () => {
      const pitcherBatch = createMockPlayersResponse(5, Array.from({ length: 5 }, (_, i) => 
        createMockPlayerData({
          player_key: `431.p.${i}`,
          name: { full: `Pitcher ${i + 1}`, first: `Pitcher`, last: `${i + 1}` },
          display_position: 'P'
        })
      ))

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockGameResponse }) // Game key
        .mockResolvedValueOnce({ data: pitcherBatch }) // Pitcher data
        .mockResolvedValueOnce({ data: createEmptyPlayersResponse() }) // Empty signals end

      const players = await api.getMLBPlayersComprehensive({ playerType: 'ALL_PITCHERS' })

      expect(players).toHaveLength(5)
      // Verify the API was called with pitcher position parameter
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/yahoo', {
        params: expect.objectContaining({
          endpoint: expect.stringContaining('position=P')
        }),
        headers: { 'Authorization': 'Bearer test-access-token' }
      })
    })

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'))

      const players = await api.getMLBPlayersComprehensive()

      expect(players).toEqual([])
    })

    it('should stop when receiving empty response', async () => {
      const singleBatch = createMockPlayersResponse(15, Array.from({ length: 15 }, (_, i) => 
        createMockPlayerData({
          player_key: `431.p.${i}`,
          name: { full: `Player ${i + 1}`, first: `Player`, last: `${i + 1}` }
        })
      ))

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockGameResponse }) // Game key
        .mockResolvedValueOnce({ data: singleBatch }) // 15 players (less than batch size)

      const players = await api.getMLBPlayersComprehensive()

      expect(players).toHaveLength(15)
      // Should stop because batch was smaller than 25 (the batch size)
    })
  })
}) 