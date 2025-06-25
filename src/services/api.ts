// src/services/api.ts
import { MoneyPuckPlayerStats, MoneyPuckTeamStats } from '../types/hockey';

class HockeyAPI {
  async getTeamRoster(teamId: number): Promise<any> {
    // Mock implementation
    return { roster: [] };
  }

  async getTeamStats(teamId: number): Promise<any> {
    // Mock implementation
    return { stats: [] };
  }

  async getAdvancedTeamStats(season: string): Promise<MoneyPuckTeamStats[]> {
    // Mock implementation
    return [];
  }

  async getAdvancedPlayerStats(season: string): Promise<MoneyPuckPlayerStats[]> {
    // Mock implementation
    return [];
  }

  async getGamesByTeam(teamId: number, season: string): Promise<any> {
    // Mock implementation
    return { games: [] };
  }

  async getLiveGameData(gameId: number): Promise<any> {
    // Mock implementation
    return { liveData: null };
  }

  async getShotData(gameId: number): Promise<any> {
    // Mock implementation
    return [];
  }

  async getGoalieStats(season: string): Promise<any> {
    // Mock implementation
    return [];
  }
}

export const hockeyAPI = new HockeyAPI();