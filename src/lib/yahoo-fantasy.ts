import axios from 'axios';

interface YahooUserResponse {
  fantasy_content: {
    users: Array<{
      user: Array<{
        profile: {
          display_name: string;
          fantasy_profile_url: string;
          image_url: string;
        };
      }>;
    }>;
  };
}

interface YahooGameKey {
  game_key: string;
  game_id: string;
  name: string;
  code: string;
  type: string;
  season: string;
}

interface YahooGamesResponse {
  fantasy_content: {
    games: Array<{
      game: [YahooGameKey, { roster_positions: unknown[], stat_categories: unknown[], stats: unknown[] }];
    }>;
  };
}

interface YahooPlayerStats {
  player_key: string;
  name: {
    full: string;
    first: string;
    last: string;
  };
  editorial_team_abbr: string;
  display_position: string;
  stats: Array<{
    stat_id: number;
    value: string | number;
  }>;
}

export class YahooFantasyAPI {
  private accessToken: string;
  private gameKeys: Map<string, string> = new Map();

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(endpoint: string): Promise<T> {
    try {
      const response = await axios.get('/api/yahoo', {
        params: { endpoint },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Yahoo Fantasy API Error:', error);
      throw error;
    }
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

  async getMLBPlayers(options: { 
    season?: string;
    start?: number;
    count?: number;
  } = {}): Promise<YahooPlayerStats[]> {
    const { season, start = 0, count = 25 } = options;
    const gameKey = await this.getMLBGameKey(season);
    return this.request<YahooPlayerStats[]>(`/game/${gameKey}/players;start=${start};count=${count}`);
  }

  async getPlayerStats(playerId: string, season?: string): Promise<YahooPlayerStats> {
    const gameKey = await this.getMLBGameKey(season);
    return this.request<YahooPlayerStats>(`/game/${gameKey}/players;player_keys=${gameKey}.p.${playerId}/stats`);
  }

  async comparePlayerStats(playerIds: string[], season?: string): Promise<YahooPlayerStats[]> {
    const gameKey = await this.getMLBGameKey(season);
    const playerKeys = playerIds.map(id => `${gameKey}.p.${id}`).join(',');
    return this.request<YahooPlayerStats[]>(`/game/${gameKey}/players;player_keys=${playerKeys}/stats`);
  }

  async getPlayerStatsAcrossSeasons(playerId: string, seasons: string[]): Promise<Record<string, YahooPlayerStats>> {
    const statsPromises = seasons.map(async (season) => {
      try {
        const stats = await this.getPlayerStats(playerId, season);
        return [season, stats];
      } catch (error) {
        console.error(`Failed to fetch stats for season ${season}:`, error);
        return [season, null];
      }
    });
    
    const results = await Promise.all(statsPromises);
    return Object.fromEntries(results.filter(([, stats]) => stats !== null));
  }

  async comparePlayerStatsAcrossSeasons(
    playerIds: string[], 
    seasons: string[]
  ): Promise<Record<string, Record<string, YahooPlayerStats>>> {
    const allStatsPromises = seasons.map(async (season) => {
      try {
        const stats = await this.comparePlayerStats(playerIds, season);
        return [season, Object.fromEntries(stats.map(stat => [stat.player_key.split('.').pop(), stat]))];
      } catch (error) {
        console.error(`Failed to fetch comparison for season ${season}:`, error);
        return [season, null];
      }
    });
    
    const results = await Promise.all(allStatsPromises);
    return Object.fromEntries(results.filter(([, stats]) => stats !== null));
  }
} 