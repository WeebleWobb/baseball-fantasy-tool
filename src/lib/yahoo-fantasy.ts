import axios from 'axios';

const YAHOO_FANTASY_BASE_URL = 'https://fantasysports.yahooapis.com/fantasy/v2';

export class YahooFantasyAPI {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request(endpoint: string) {
    try {
      const response = await axios.get(`${YAHOO_FANTASY_BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Yahoo Fantasy API Error:', error);
      throw error;
    }
  }

  async getMLBPlayers(start: number = 0, count: number = 25) {
    return this.request(`/games/mlb/players;start=${start};count=${count};sort=OR`);
  }

  async getPlayerStats(playerId: string) {
    return this.request(`/player/${playerId}/stats`);
  }

  async comparePlayerStats(playerIds: string[]) {
    const playerStatsPromises = playerIds.map(id => this.getPlayerStats(id));
    return Promise.all(playerStatsPromises);
  }
} 