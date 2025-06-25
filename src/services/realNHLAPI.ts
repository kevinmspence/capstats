// src/services/realNHLAPI.ts
import axios, { AxiosResponse } from 'axios';

interface CacheEntry {
  data: any;
  timestamp: number;
}

class RealNHLAPIService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for real data
  
  // API Base URLs - Updated 2024/2025 season endpoints
  private readonly NHL_API_BASE = 'https://api-web.nhle.com/v1';
  private readonly NHL_STATS_API = 'https://api.nhle.com/stats/rest/en';
  private readonly MONEYPUCK_API = 'https://moneypuck.com/moneypuck/playerData';

  /**
   * Generic cached request method
   */
  private async cachedRequest(url: string, cacheKey?: string): Promise<any> {
    const key = cacheKey || url;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`Cache hit for: ${key}`);
      return cached.data;
    }

    try {
      console.log(`Fetching from NHL API: ${url}`);
      const response: AxiosResponse = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'NHL-Analytics-Dashboard/1.0',
          'Accept': 'application/json'
        }
      });
      
      this.cache.set(key, {
        data: response.data,
        timestamp: Date.now()
      });
      
      return response.data;
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.log(`Returning expired cache for: ${key}`);
        return cached.data;
      }
      
      throw new Error(`Failed to fetch data from ${url}: ${error}`);
    }
  }

  // =============================================================================
  // NHL OFFICIAL API METHODS (2024-2025 Season)
  // =============================================================================

  /**
   * Get current team roster
   */
  async getTeamRoster(teamAbbr: string = 'WSH'): Promise<any> {
    const url = `${this.NHL_API_BASE}/roster/${teamAbbr}/current`;
    return this.cachedRequest(url, `roster-${teamAbbr}`);
  }

  /**
   * Get team schedule for current season
   */
  async getTeamSchedule(teamAbbr: string = 'WSH', season: string = '20242025'): Promise<any> {
    const url = `${this.NHL_API_BASE}/club-schedule-season/${teamAbbr}/${season}`;
    return this.cachedRequest(url, `schedule-${teamAbbr}-${season}`);
  }

  /**
   * Get current standings
   */
  async getCurrentStandings(): Promise<any> {
    const url = `${this.NHL_API_BASE}/standings/now`;
    return this.cachedRequest(url, 'standings-current');
  }

  /**
   * Get team stats from NHL Stats API
   */
  async getTeamStats(teamAbbr: string = 'WSH', season: string = '20242025'): Promise<any> {
    const url = `${this.NHL_STATS_API}/club-stats-season/${teamAbbr}/${season}`;
    return this.cachedRequest(url, `team-stats-${teamAbbr}-${season}`);
  }

  /**
   * Get player statistics
   */
  async getPlayerStats(season: string = '20242025', limit: number = 100): Promise<any> {
    const url = `${this.NHL_STATS_API}/skater/summary`;
    const params = `?limit=${limit}&cayenneExp=seasonId=${season}&sort=points&dir=DESC`;
    return this.cachedRequest(url + params, `player-stats-${season}`);
  }

  /**
   * Get goalie statistics
   */
  async getGoalieStats(season: string = '20242025', limit: number = 50): Promise<any> {
    const url = `${this.NHL_STATS_API}/goalie/summary`;
    const params = `?limit=${limit}&cayenneExp=seasonId=${season}&sort=wins&dir=DESC`;
    return this.cachedRequest(url + params, `goalie-stats-${season}`);
  }

  /**
   * Get live game data
   */
  async getLiveGameData(gameId: string): Promise<any> {
    const url = `${this.NHL_API_BASE}/gamecenter/${gameId}/play-by-play`;
    return this.cachedRequest(url, `live-game-${gameId}`);
  }

  /**
   * Get game boxscore
   */
  async getGameBoxscore(gameId: string): Promise<any> {
    const url = `${this.NHL_API_BASE}/gamecenter/${gameId}/boxscore`;
    return this.cachedRequest(url, `boxscore-${gameId}`);
  }

  /**
   * Get today's games
   */
  async getTodaysGames(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const url = `${this.NHL_API_BASE}/schedule/${today}`;
    return this.cachedRequest(url, `schedule-${today}`);
  }

  // =============================================================================
  // MONEYPUCK ADVANCED ANALYTICS
  // =============================================================================

  /**
   * Get advanced team statistics from MoneyPuck
   */
  async getMoneyPuckTeamStats(season: string = '2024'): Promise<any> {
    const url = `${this.MONEYPUCK_API}/teams/${season}/regular`;
    return this.cachedRequest(url, `moneypuck-teams-${season}`);
  }

  /**
   * Get advanced player statistics from MoneyPuck
   */
  async getMoneyPuckPlayerStats(season: string = '2024'): Promise<any> {
    const url = `${this.MONEYPUCK_API}/skaters/${season}/regular`;
    return this.cachedRequest(url, `moneypuck-players-${season}`);
  }

  /**
   * Get advanced goalie statistics from MoneyPuck
   */
  async getMoneyPuckGoalieStats(season: string = '2024'): Promise<any> {
    const url = `${this.MONEYPUCK_API}/goalies/${season}/regular`;
    return this.cachedRequest(url, `moneypuck-goalies-${season}`);
  }

  // =============================================================================
  // COMPREHENSIVE DATA INTEGRATION
  // =============================================================================

  /**
   * Get complete Washington Capitals data package with real data
   */
  async getCapitalsDataPackage(season: string = '20242025'): Promise<{
    basic: any;
    advanced: any;
    roster: any;
    schedule: any;
    standings: any;
    playerStats: any;
    goalieStats: any;
    todaysGames: any;
    lastUpdated: Date;
  }> {
    try {
      console.log('🏒 Fetching REAL Capitals data from NHL APIs...');
      
      // Fetch all data sources in parallel
      const [
        roster,
        schedule,
        standings,
        teamStats,
        playerStats,
        goalieStats,
        moneyPuckTeams,
        moneyPuckPlayers,
        moneyPuckGoalies,
        todaysGames
      ] = await Promise.all([
        this.getTeamRoster('WSH'),
        this.getTeamSchedule('WSH', season),
        this.getCurrentStandings(),
        this.getTeamStats('WSH', season),
        this.getPlayerStats(season, 200),
        this.getGoalieStats(season, 100),
        this.getMoneyPuckTeamStats('2024'),
        this.getMoneyPuckPlayerStats('2024'),
        this.getMoneyPuckGoalieStats('2024'),
        this.getTodaysGames()
      ]);

      // Process standings to find Capitals
      const capitalsStanding = standings.standings?.find((team: any) => 
        team.teamAbbrev?.default === 'WSH'
      );

      // Process MoneyPuck data for Capitals
      const capitalsAdvanced = moneyPuckTeams?.find((team: any) => 
        team.team === 'WSH'
      );

      const capitalsPlayers = moneyPuckPlayers?.filter((player: any) => 
        player.team === 'WSH'
      );

      const capitalsGoalies = moneyPuckGoalies?.filter((goalie: any) => 
        goalie.team === 'WSH'
      );

      // Filter NHL player stats for Capitals players
      const capitalsNHLPlayers = playerStats?.data?.filter((player: any) => 
        player.teamAbbrevs?.some((team: any) => team.teamAbbrev === 'WSH')
      ) || [];

      const capitalsNHLGoalies = goalieStats?.data?.filter((goalie: any) => 
        goalie.teamAbbrevs?.some((team: any) => team.teamAbbrev === 'WSH')
      ) || [];

      console.log('✅ Real NHL data successfully fetched!', {
        rosterPlayers: roster?.forwards?.length + roster?.defensemen?.length + roster?.goalies?.length || 0,
        advancedPlayers: capitalsPlayers?.length || 0,
        upcomingGames: schedule?.games?.length || 0,
        todaysGames: todaysGames?.gamesByDate?.[0]?.games?.length || 0
      });

      return {
        basic: {
          teamStats,
          standing: capitalsStanding,
          playerStats: capitalsNHLPlayers,
          goalieStats: capitalsNHLGoalies
        },
        advanced: {
          team: capitalsAdvanced,
          players: capitalsPlayers,
          goalies: capitalsGoalies
        },
        roster,
        schedule,
        standings: standings.standings,
        playerStats: capitalsPlayers,
        goalieStats: capitalsGoalies,
        todaysGames,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('❌ Error fetching real Capitals data:', error);
      throw new Error(`Failed to fetch real NHL data: ${error}`);
    }
  }

  /**
   * Get real-time game data for active Capitals games
   */
  async getActiveCapitalsGames(): Promise<any[]> {
    try {
      const todaysGames = await this.getTodaysGames();
      const today = new Date().toISOString().split('T')[0];
      
      // Find Capitals games today
      const capitalsGames = todaysGames.gamesByDate?.[0]?.games?.filter((game: any) => 
        game.homeTeam?.abbrev === 'WSH' || game.awayTeam?.abbrev === 'WSH'
      ) || [];

      // Get live data for each Capitals game
      const gameDataPromises = capitalsGames.map(async (game: any) => {
        try {
          const [liveData, boxscore] = await Promise.all([
            this.getLiveGameData(game.id),
            this.getGameBoxscore(game.id)
          ]);
          return {
            ...game,
            liveData,
            boxscore
          };
        } catch (error) {
          console.warn(`Failed to get live data for game ${game.id}:`, error);
          return game;
        }
      });

      return Promise.all(gameDataPromises);
    } catch (error) {
      console.error('Error fetching active Capitals games:', error);
      return [];
    }
  }

  /**
   * Clear cache (useful for forcing fresh data)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ NHL API cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const realNHLAPI = new RealNHLAPIService();

// Export helper function for data processing
export const processRealCapitalsData = (rawData: any) => {
  try {
    const basic = rawData.basic;
    const advanced = rawData.advanced;
    
    return {
      team: {
        record: `${basic.standing?.wins || 0}-${basic.standing?.losses || 0}-${basic.standing?.otLosses || 0}`,
        points: basic.standing?.points || 0,
        position: basic.standing?.divisionSequence || 'N/A',
        goalsFor: basic.standing?.goalFor || 0,
        goalsAgainst: basic.standing?.goalAgainst || 0,
        differential: (basic.standing?.goalFor || 0) - (basic.standing?.goalAgainst || 0),
        powerPlayPct: basic.teamStats?.powerPlayPct || 'N/A',
        penaltyKillPct: basic.teamStats?.penaltyKillPct || 'N/A',
        // Advanced stats from MoneyPuck
        corsiFor: advanced.team?.corsiForPct ? (advanced.team.corsiForPct * 100).toFixed(1) : 'N/A',
        xGoalsFor: advanced.team?.xGoalsFor?.toFixed(1) || 'N/A',
        xGoalsAgainst: advanced.team?.xGoalsAgainst?.toFixed(1) || 'N/A',
        xGoalsForPct: advanced.team?.xGoalsForPct ? (advanced.team.xGoalsForPct * 100).toFixed(1) : 'N/A'
      },
      players: advanced.players?.slice(0, 20) || [], // Top 20 players
      goalies: advanced.goalies || [],
      roster: rawData.roster,
      upcomingGames: rawData.schedule?.games?.slice(0, 5) || [], // Next 5 games
      todaysGames: rawData.todaysGames?.gamesByDate?.[0]?.games || [],
      standings: rawData.standings || [],
      lastUpdated: rawData.lastUpdated
    };
  } catch (error) {
    console.error('Error processing real Capitals data:', error);
    throw new Error(`Failed to process real NHL data: ${error}`);
  }
};