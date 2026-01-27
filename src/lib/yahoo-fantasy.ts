import axios from 'axios';

import type { PlayerFilterType } from '@/types/hooks';
import type { YahooPlayerStats } from '@/types/yahoo-fantasy';
import {
  gamesResponseSchema,
  usersResponseSchema,
  playersResponseSchema,
  type UsersResponse,
  type PlayersResponse
} from '@/lib/schemas';

export class YahooFantasyAPI {
  private readonly accessToken: string;
  private readonly gameKeys: Map<string, string> = new Map();

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const response = await axios.get('/api/yahoo', {
      params: { endpoint },
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });
    return response.data;
  }

  private async requestWithValidation<T>(
    endpoint: string,
    schema: { parse: (data: unknown) => T }
  ): Promise<T> {
    const data = await this.request<unknown>(endpoint);
    return schema.parse(data);
  }

  async getUserInfo(): Promise<UsersResponse> {
    return this.requestWithValidation(
      '/users;use_login=1/profile',
      usersResponseSchema
    );
  }

  async getMLBGameKey(): Promise<string> {
    const currentSeason = new Date().getFullYear().toString();

    const cachedKey = this.gameKeys.get(currentSeason);
    if (cachedKey) return cachedKey;

    const response = await this.requestWithValidation(
      `/games;game_codes=mlb;seasons=${currentSeason}`,
      gamesResponseSchema
    );

    // Games is object with numeric keys, not array
    const gamesObj = response.fantasy_content.games;
    const firstGame = gamesObj['0'];

    if (!firstGame || typeof firstGame === 'number') {
      throw new Error(`No MLB game found for season ${currentSeason}`);
    }

    const gameKey = firstGame.game[0].game_key;
    this.gameKeys.set(currentSeason, gameKey);
    return gameKey;
  }

  private getYahooPositionParameter(playerType: PlayerFilterType = 'ALL_BATTERS'): string {
    switch (playerType) {
      case 'ALL_PITCHERS':
      case 'SP':
      case 'RP':
        return 'P';
      case 'ALL_BATTERS':
      case 'C':
      case '1B':
      case '2B':
      case 'SS':
      case '3B':
      case 'OF':
      case 'Util':
      default:
        return 'B';
    }
  }

  private transformPlayersResponse(response: PlayersResponse): YahooPlayerStats[] {
    const players: YahooPlayerStats[] = [];
    const playersData = response.fantasy_content.game[1].players;

    for (const key in playersData) {
      if (key === 'count') continue;

      const playerEntry = playersData[key];
      if (typeof playerEntry === 'number') continue;

      const playerMetadata = playerEntry.player[0];
      const playerStatsData = playerEntry.player[1]?.player_stats;

      // Extract player info from metadata array
      let playerKey = '';
      let name = { full: '', first: '', last: '' };
      let editorialTeamAbbr = '';
      let displayPosition = '';

      for (const item of playerMetadata) {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          if ('player_key' in item) playerKey = item.player_key as string;
          if ('name' in item) {
            const nameData = item.name as { full: string; first: string; last: string };
            name = nameData;
          }
          if ('editorial_team_abbr' in item) editorialTeamAbbr = item.editorial_team_abbr as string;
          if ('display_position' in item) displayPosition = item.display_position as string;
        }
      }

      // Build byStatId lookup - stats are wrapped in { stat: { stat_id, value } }
      let playerStats: YahooPlayerStats['player_stats'] = undefined;
      if (playerStatsData?.stats) {
        const byStatId: Record<number, string | number> = {};
        const flatStats: Array<{ stat_id: number; value: string | number }> = [];

        for (const statEntry of playerStatsData.stats) {
          const stat = statEntry.stat;
          const statId = parseInt(stat.stat_id, 10);
          const value = stat.value;
          byStatId[statId] = value;
          flatStats.push({ stat_id: statId, value });
        }

        playerStats = {
          stats: flatStats,
          byStatId
        };
      }

      players.push({
        player_key: playerKey,
        name,
        editorial_team_abbr: editorialTeamAbbr,
        display_position: displayPosition,
        player_stats: playerStats
      });
    }

    return players;
  }

  async getMLBPlayers(options: { start?: number; count?: number; playerType?: PlayerFilterType } = {}): Promise<YahooPlayerStats[]> {
    const { start = 0, count = 25, playerType = 'ALL_BATTERS' } = options;

    const gameKey = await this.getMLBGameKey();
    const positionParam = this.getYahooPositionParameter(playerType);

    const endpoint = `/game/${gameKey}/players;start=${start};count=${count};sort=AR;status=A;position=${positionParam}/stats`;

    const response = await this.requestWithValidation(endpoint, playersResponseSchema);
    return this.transformPlayersResponse(response);
  }

  async getMLBPlayersComprehensive(options: { playerType?: PlayerFilterType; maxPlayers?: number } = {}): Promise<YahooPlayerStats[]> {
    const { playerType = 'ALL_BATTERS', maxPlayers = 500 } = options;
    const batchSize = 25;
    const maxRetries = 3;
    const retryDelay = 1000;

    const allPlayers: YahooPlayerStats[] = [];
    let currentStart = 0;
    let hasMorePlayers = true;
    let consecutiveEmptyResponses = 0;

    while (hasMorePlayers && allPlayers.length < maxPlayers) {
      let retryCount = 0;
      let success = false;

      while (retryCount < maxRetries && !success) {
        try {
          const batchPlayers = await this.getMLBPlayers({
            start: currentStart,
            count: batchSize,
            playerType
          });

          if (batchPlayers.length === 0) {
            consecutiveEmptyResponses++;
            if (consecutiveEmptyResponses >= 2) {
              hasMorePlayers = false;
            }
          } else {
            consecutiveEmptyResponses = 0;
            allPlayers.push(...batchPlayers);

            if (batchPlayers.length < batchSize) {
              hasMorePlayers = false;
            }
          }

          success = true;
        } catch {
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retryCount - 1)));
          } else {
            hasMorePlayers = false;
          }
        }
      }

      currentStart += batchSize;
    }

    return allPlayers;
  }
}
