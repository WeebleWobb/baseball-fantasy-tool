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

export class YahooFantasyAPI {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request(endpoint: string) {
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
    return this.request('/users;use_login=1/profile');
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