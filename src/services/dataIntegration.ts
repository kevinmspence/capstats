// src/services/dataIntegration.ts
// Clean, self-contained version with no conflicts

interface PlayerStats {
  playerId: number;
  season: number;
  name: string;
  team: string;
  position: string;
  games: number;
  icetime: number;
  xGoals: number;
  xAssists: number;
  xPoints: number;
  goals: number;
  assists: number;
  points: number;
  shots: number;
  corsiForPct: number;
  fenwickForPct: number;
}

interface TeamStats {
  team: string;
  name: string;
  season: number;
  games: number;
  corsiForPct: number;
  fenwickForPct: number;
  xGoalsForPct: number;
  xGoalsFor: number;
  xGoalsAgainst: number;
  goalsFor: number;
  goalsAgainst: number;
}

// Mock API service
class MockAPI {
  async getTeamRoster(): Promise<any> {
    return {
      roster: [
        { person: { id: 8471214, fullName: "Alexander Ovechkin" }, jerseyNumber: "8", position: { code: "L" } },
        { person: { id: 8470638, fullName: "Nicklas Backstrom" }, jerseyNumber: "19", position: { code: "C" } }
      ]
    };
  }

  async getTeamStats(): Promise<any> {
    return {
      stats: [{
        splits: [{
          stat: {
            gamesPlayed: 43,
            wins: 25,
            losses: 15,
            ot: 3,
            pts: 53,
            goalsPerGame: 3.2,
            goalsAgainstPerGame: 2.8,
            powerPlayPercentage: "22.5",
            penaltyKillPercentage: "81.2"
          }
        }]
      }]
    };
  }

  async getAdvancedTeamStats(): Promise<TeamStats[]> {
    return [{
      team: 'WSH',
      name: 'Washington Capitals',
      season: 20242025,
      games: 43,
      corsiForPct: 0.521,
      fenwickForPct: 0.518,
      xGoalsForPct: 0.541,
      xGoalsFor: 2.85,
      xGoalsAgainst: 2.42,
      goalsFor: 138,
      goalsAgainst: 120
    }];
  }

  async getAdvancedPlayerStats(): Promise<PlayerStats[]> {
    return [
      {
        playerId: 8471214,
        season: 20242025,
        name: "Alexander Ovechkin",
        team: "WSH",
        position: "L",
        games: 43,
        icetime: 1205,
        xGoals: 15.2,
        xAssists: 12.8,
        xPoints: 28.0,
        goals: 18,
        assists: 15,
        points: 33,
        shots: 145,
        corsiForPct: 0.485,
        fenwickForPct: 0.492
      },
      {
        playerId: 8470638,
        season: 20242025,
        name: "Nicklas Backstrom",
        team: "WSH",
        position: "C",
        games: 35,
        icetime: 1089,
        xGoals: 9.1,
        xAssists: 19.5,
        xPoints: 28.6,
        goals: 8,
        assists: 22,
        points: 30,
        shots: 89,
        corsiForPct: 0.512,
        fenwickForPct: 0.518
      },
      {
        playerId: 8476346,
        season: 20242025,
        name: "Tom Wilson",
        team: "WSH",
        position: "R",
        games: 40,
        icetime: 945,
        xGoals: 10.8,
        xAssists: 15.2,
        xPoints: 26.0,
        goals: 12,
        assists: 18,
        points: 30,
        shots: 98,
        corsiForPct: 0.495,
        fenwickForPct: 0.501
      }
    ];
  }

  async getGamesByTeam(): Promise<any> {
    return { games: [] };
  }

  async getLiveGameData(): Promise<any> {
    return { liveData: null };
  }

  async getShotData(): Promise<any> {
    return [];
  }
}

class CapitalsDataService {
  private api: MockAPI;
  private lastUpdate: Map<string, Date> = new Map();

  constructor() {
    this.api = new MockAPI();
  }

  async fetchAndIntegrateCapitalsData(forceRefresh: boolean = false): Promise<{
    teamStats: any;
    playerStats: PlayerStats[];
    roster: any;
    schedule: any;
  }> {
    try {
      console.log('Fetching Capitals data...');

      const [roster, teamStats, advancedTeamStats, playerStats, schedule] = await Promise.all([
        this.api.getTeamRoster(),
        this.api.getTeamStats(),
        this.api.getAdvancedTeamStats(),
        this.api.getAdvancedPlayerStats(),
        this.api.getGamesByTeam()
      ]);

      const capitalsAdvanced = advancedTeamStats.find(team => team.team === 'WSH');
      const capitalsPlayers = playerStats.filter(player => player.team === 'WSH');

      const integratedTeamStats = {
        basic: teamStats,
        advanced: capitalsAdvanced,
        lastUpdated: new Date()
      };

      this.lastUpdate.set('capitals-data', new Date());

      return {
        teamStats: integratedTeamStats,
        playerStats: capitalsPlayers,
        roster,
        schedule
      };

    } catch (error) {
      console.error('Error fetching data:', error);
      throw new Error(`Data fetch failed: ${error}`);
    }
  }

  async integrateGameData(gameId: number): Promise<{
    liveData: any;
    shotData: any;
    advancedMetrics: any;
  }> {
    try {
      const [liveData, shotData] = await Promise.all([
        this.api.getLiveGameData(),
        this.api.getShotData()
      ]);

      return {
        liveData,
        shotData,
        advancedMetrics: {}
      };
    } catch (error) {
      console.error('Error integrating game data:', error);
      throw new Error(`Game data integration failed: ${error}`);
    }
  }

  async generatePredictiveInsights(teamStats: any, playerStats: PlayerStats[]): Promise<{
    playoffProbability: number;
    projectedRecord: { wins: number; losses: number; ot: number };
    keyInsights: string[];
    recommendations: string[];
  }> {
    const currentPoints = teamStats.basic?.stats?.[0]?.splits?.[0]?.stat?.pts || 53;
    const gamesPlayed = teamStats.basic?.stats?.[0]?.splits?.[0]?.stat?.gamesPlayed || 43;
    const remainingGames = 82 - gamesPlayed;
    
    const pointPercentage = gamesPlayed > 0 ? currentPoints / (gamesPlayed * 2) : 0.5;
    const projectedPoints = currentPoints + (remainingGames * 2 * pointPercentage);
    const playoffProbability = Math.min(Math.max((projectedPoints - 85) / 15, 0), 1);

    const additionalWins = Math.round(remainingGames * pointPercentage * 0.7);
    const currentWins = teamStats.basic?.stats?.[0]?.splits?.[0]?.stat?.wins || 25;
    const currentLosses = teamStats.basic?.stats?.[0]?.splits?.[0]?.stat?.losses || 15;
    const currentOT = teamStats.basic?.stats?.[0]?.splits?.[0]?.stat?.ot || 3;

    const projectedRecord = {
      wins: currentWins + additionalWins,
      losses: currentLosses + (remainingGames - additionalWins - Math.round(remainingGames * 0.1)),
      ot: currentOT + Math.round(remainingGames * 0.1)
    };

    const keyInsights = [
      'Strong offensive production from top line',
      'Power play performing above league average',
      'Solid puck possession metrics'
    ];

    const recommendations = [
      'Focus on defensive consistency',
      'Monitor player health and load management',
      'Evaluate trade deadline opportunities'
    ];

    return {
      playoffProbability: Math.round(playoffProbability * 100) / 100,
      projectedRecord,
      keyInsights,
      recommendations
    };
  }

  async generateTeamReport(): Promise<{
    summary: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    actionItems: string[];
  }> {
    try {
      const data = await this.fetchAndIntegrateCapitalsData();
      const predictions = await this.generatePredictiveInsights(data.teamStats, data.playerStats);

      return {
        summary: `The Washington Capitals currently have a ${(predictions.playoffProbability * 100).toFixed(1)}% playoff probability with projected record of ${predictions.projectedRecord.wins}-${predictions.projectedRecord.losses}-${predictions.projectedRecord.ot}. Team shows strong offensive capabilities.`,
        
        strengths: [
          'Elite goal-scoring from Ovechkin and top line',
          'Strong power play performance (22.5%)',
          'Veteran playoff experience',
          'Solid puck possession metrics'
        ],
        
        weaknesses: [
          'Defensive consistency needs improvement',
          'Aging core players',
          'Penalty kill could be stronger',
          'Depth scoring concerns'
        ],
        
        opportunities: [
          'Trade deadline acquisitions for playoff push',
          'Development of young prospects',
          'System improvements under coaching staff',
          'Health returns of injured players'
        ],
        
        threats: [
          'Competitive Metropolitan Division',
          'Salary cap constraints',
          'Injury risks to key players',
          'Strong division rivals'
        ],
        
        actionItems: [
          ...predictions.recommendations,
          'Monitor player health and load management',
          'Evaluate defensive pairings',
          'Assess trade deadline opportunities'
        ]
      };

    } catch (error) {
      console.error('Error generating team report:', error);
      throw new Error(`Team report generation failed: ${error}`);
    }
  }

  startAutoRefresh(intervalMinutes: number = 5): void {
    setInterval(async () => {
      try {
        console.log('Auto-refreshing data...');
        await this.fetchAndIntegrateCapitalsData(false);
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

// Export singleton instance
export const dataIntegrationService = new CapitalsDataService();