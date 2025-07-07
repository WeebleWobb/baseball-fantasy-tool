import { YahooFantasyAPI } from '@/lib/yahoo-fantasy'
import { 
  mockGameResponse, 
  mockPlayersResponse, 
  mockUserInfo 
} from '@/__tests__/utils/test-fixtures'
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

    it('should fetch and cache game keys correctly', async () => {
      const gameKey1 = await api.getMLBGameKey('2024')
      const gameKey2 = await api.getMLBGameKey('2024') // Should use cache
      
      expect(gameKey1).toBe('431')
      expect(gameKey2).toBe('431')
      expect(mockedAxios.get).toHaveBeenCalledTimes(1) // Cached on second call
    })

    it('should use current year when no season specified', async () => {
      const currentYear = new Date().getFullYear().toString()
      
      const gameKey = await api.getMLBGameKey()
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/yahoo', {
        params: { endpoint: `/games;game_codes=mlb;seasons=${currentYear}` },
        headers: { 'Authorization': `Bearer ${mockAccessToken}` }
      })
      expect(gameKey).toBe('431')
    })

    it('should throw error when no games found', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { fantasy_content: { games: [] } }
      })
      
      await expect(api.getMLBGameKey('2020')).rejects.toThrow('No MLB game found for season 2020')
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
      expect(players[0]).toEqual({
        player_key: '431.p.8967',
        name: {
          full: 'Mike Trout',
          first: 'Mike',
          last: 'Trout'
        },
        editorial_team_abbr: 'LAA',
        display_position: 'OF',
        player_stats: {
          stats: [
            { stat_id: 8, value: 150 }, // HITS
            { stat_id: 6, value: 500 }, // AT_BATS
            { stat_id: 13, value: 35 }, // HOME_RUNS
            { stat_id: 9, value: 100 }, // RBI
            { stat_id: 7, value: 90 },  // RUNS
            { stat_id: 16, value: 15 }  // STOLEN_BASES
          ]
        }
      })
      expect(players[1].display_position).toBe('2B,OF') // Multiple positions
    })

    it('should use pagination parameters correctly', async () => {
      await api.getMLBPlayers({ start: 25, count: 50 })
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/yahoo', 
        expect.objectContaining({
          params: expect.objectContaining({
            endpoint: expect.stringContaining('start=25;count=50')
          })
        })
      )
    })

    it('should validate seasons and default to current year for invalid ones', async () => {
      const currentYear = new Date().getFullYear()
      
      await api.getMLBPlayers({ season: '1999' }) // Too old
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/yahoo', 
        expect.objectContaining({
          params: expect.objectContaining({
            endpoint: expect.stringContaining(`seasons=${currentYear}`)
          })
        })
      )
    })

    it('should return empty array when API fails or returns malformed data', async () => {
      // Test API error
      mockedAxios.get.mockReset()
      mockedAxios.get.mockRejectedValue(new Error('API Error'))
      
      const playersError = await api.getMLBPlayers()
      expect(playersError).toEqual([])
      
      // Test malformed response
      mockedAxios.get.mockReset()
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockGameResponse })
        .mockResolvedValueOnce({ data: { fantasy_content: null } })
      
      const playersMalformed = await api.getMLBPlayers()
      expect(playersMalformed).toEqual([])
    })
  })
}) 