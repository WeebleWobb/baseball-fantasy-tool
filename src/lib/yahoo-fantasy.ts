import axios from 'axios';
import type {
  YahooUserResponse,
  YahooGamesResponse,
  YahooPlayerStats,
  YahooPlayersResponse,
} from '@/types/yahoo-fantasy';

export class YahooFantasyAPI {
  private accessToken: string;
  private gameKeys: Map<string, string> = new Map();

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const response = await axios.get('/api/yahoo', {
      params: { endpoint },
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    });
    return response.data;
  }

  async getUserInfo(): Promise<YahooUserResponse> {
    return this.request<YahooUserResponse>('/users;use_login=1/profile');
  }

  async getMLBGameKey(season?: string): Promise<string> {
    // If no season specified, use current year
    const targetSeason = season || new Date().getFullYear().toString();
    
    // Check if we already have this season's key cached
    const cachedKey = this.gameKeys.get(targetSeason);
    if (cachedKey) return cachedKey;
    
    // Fetch the game key for the specified season
    const response = await this.request<YahooGamesResponse>(`/games;game_codes=mlb;seasons=${targetSeason}`);
    const games = response.fantasy_content.games;
    
    if (games.length === 0) {
      throw new Error(`No MLB game found for season ${targetSeason}`);
    }
    
    const gameKey = games[0].game[0].game_key;
    this.gameKeys.set(targetSeason, gameKey);
    return gameKey;
  }

  async getMLBPlayers(options: { season?: string; start?: number; count?: number; } = {}): Promise<YahooPlayerStats[]> {
    const { start = 0, count = 25 } = options;
    let { season } = options;
    
    // Validate and adjust season
    const currentYear = new Date().getFullYear();
    if (!season) {
      season = currentYear.toString();
      // MLB season starts in March/April, so before that use previous year
      if (new Date().getMonth() < 2) {
        season = (currentYear - 1).toString();
      }
    } else {
      const seasonYear = parseInt(season);
      if (isNaN(seasonYear) || seasonYear < 2002 || seasonYear > currentYear + 1) {
        season = currentYear.toString();
      }
    }

    try {
      const gameKey = await this.getMLBGameKey(season);
      
      // Request players with their season stats
      const endpoint = `/game/${gameKey}/players;start=${start};count=${count};sort=AR;status=A;position=B/stats`;
      const response = await this.request<YahooPlayersResponse>(endpoint);
      
      const playersData = response?.fantasy_content?.game?.[1]?.players;
      if (!playersData || typeof playersData !== 'object') {
        return [];
      }

      const players: YahooPlayerStats[] = [];
      Object.entries(playersData).forEach(([key, value]) => {
        if (key === 'count' || !value || typeof value !== 'object' || !('player' in value)) {
          return;
        }
        
        const playerArray = value.player;
        if (!Array.isArray(playerArray) || playerArray.length < 1) {
          return;
        }

        // The player data is in the first element of the array, which is itself an array of objects
        const playerDataArray = playerArray[0] as Array<Record<string, unknown>>;
        
        // Extract basic player info from the array of objects
        const playerKey = playerDataArray.find((item) => item.player_key)?.player_key as string;
        const nameObj = playerDataArray.find((item) => item.name);
        const name = nameObj?.name as { full: string; first: string; last: string };
        const teamAbbr = playerDataArray.find((item) => item.editorial_team_abbr)?.editorial_team_abbr as string;
        const position = playerDataArray.find((item) => item.display_position)?.display_position as string;
        
        // Look for stats in the player array - stats are usually in the second element
        let statsData = null;
        if (playerArray.length > 1 && playerArray[1]?.player_stats) {
          statsData = playerArray[1].player_stats;
        }
        
        let processedStats: Array<{ stat_id: number; value: string | number }> = [];
        if (statsData?.stats) {
          // Handle different possible stats structures
          if (Array.isArray(statsData.stats)) {
            processedStats = statsData.stats.map((statItem: Record<string, unknown>) => {
              // Check if it's wrapped in a 'stat' object
              const stat = (statItem as Record<string, unknown>).stat || statItem;
              return {
                stat_id: parseInt(String((stat as Record<string, unknown>).stat_id || '0')),
                value: ((stat as Record<string, unknown>).value as string | number) || 0
              };
            });
          }
        }

        if (playerKey && name) {
          players.push({
            player_key: playerKey,
            name: {
              full: name.full,
              first: name.first,
              last: name.last
            },
            editorial_team_abbr: teamAbbr || '',
            display_position: position || '',
            player_stats: {
              stats: processedStats
            }
          });
        }
      });

      return players;
    } catch {
      return [];
    }
  }


} 