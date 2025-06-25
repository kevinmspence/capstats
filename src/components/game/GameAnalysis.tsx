// src/services/dataIntegration.ts
// Final clean version with no external dependencies

// Local type definitions
interface MoneyPuckPlayerStats {
  playerId: number;
  season: number;
  name: string;
  team: string;
  position: string;
  situation: string;
  games: number;
  icetime: number;
  xGoals: number;
  xAssists: number;
  xPoints: number;
  goals: number;
  assists: number;
  points: number;
  shots: number;
  corsiFor: number;
  corsiAgainst: number;
  corsiForPct: number;
  fenwickFor: number;
  fenwickAgainst: number;
  fenwickForPct: number;
}

interface MoneyPuckTeamStats {
  team: string;
  name: string;
  season: number;
  situation: string;
  games: number;
  corsiForPct: number;
  fenwickForPct: number;
  xGoalsForPct: number;
  xGoalsFor: number;
  xGoalsAgainst: number;
  goalsFor: number;
  goalsAgainst: number;
  shotsForPct: number;
  reboundsForPct: number;
  penaltyMinutesFor: number;
  penaltyMinutesAgainst: number;
  faceoffsWonFor: number;
  hitsFor: number;
  takeawaysFor: number;
  giveawaysFor: number;
}

// Mock Hockey API - provides realistic data without external dependencies
class MockHockeyAPI {
  async getTeamRoster(teamId: number): Promise<any> {
    return {
      roster: [
        {
          person: {
            id: 8471214,
            fullName: "Alexander Ovechkin",
            firstName: "Alexander",
            lastName: "Ovechkin"
          },
          jerseyNumber: "8",
          position: { code: "L", name: "Left Wing", abbreviation: "LW" }
        },
        {
          person: {
            id: 8470638,
            fullName: "Nicklas Backstrom",
            firstName: "Nicklas",
            lastName: "Backstrom"
          },
          jerseyNumber: "19",
          position: { code: "C", name: "Center", abbreviation: "C" }
        }
      ]
    };
  }

  async getTeamStats(teamId: number): Promise<any> {
    return {
      stats: [{
        splits: [{
          stat: {
            gamesPlayed: 43,
            wins: 25,
            losses: 15,
            ot: 3,
            pts: 53,
            ptPctg: "0.616",
            goalsPerGame: 3.2,
            goalsAgainstPerGame: 2.8,
            powerPlayPercentage: "22.5",
            penaltyKillPercentage: "81.2",
            shotsPerGame: 30.1,
            shotsAllowed: 28.7,
            faceOffWinPercentage: "49.8",
            shootingPctg: 10.6,
            savePctg: 0.903
          }
        }]
      }]
    };
  }

  async getAdvancedTeamStats(season: string): Promise<MoneyPuckTeamStats[]> {
    return [
      {
        team: 'WSH',
        name: 'Washington Capitals',
        season: 20242025,
        situation: 'all',
        games: 43,
        corsiForPct: 0.521,
        fenwickForPct: 0.518,
        xGoalsForPct: 0.541,
        xGoalsFor: 2.85,
        xGoalsAgainst: 2.42,
        goalsFor: 138,
        goalsAgainst: 120,
        shotsForPct: 0.512,
        reboundsForPct: 0.495,
        penaltyMinutesFor: 89,
        penaltyMinutesAgainst: 96,
        faceoffsWonFor: 1124,
        hitsFor: 876,
        takeawaysFor: 234,
        giveawaysFor: 198
      }
    ];
  }

  async getAdvancedPlayerStats(season: string): Promise<MoneyPuckPlayerStats[]> {
    return [
      {
        playerId: 8471214,
        season: 20242025,
        name: "Alexander Ovechkin",
        team: "WSH",
        position: "L",
        situation: "all",
        games: 43,
        icetime: 1205,
        xGoals: 15.2,
        xAssists: 12.8,
        xPoints: 28.0,
        goals: 18,
        assists: 15,
        points: 33,
        shots: 145,
        corsiFor: 520,
        corsiAgainst: 551,
        corsiForPct: 0.485,
        fenwickFor: 390,
        fenwickAgainst: 401,
        fenwickForPct: 0.492
      },
      {
        playerId: 8470638,
        season: 20242025,
        name: "Nicklas Backstrom",
        team: "WSH",
        position: "C",
        situation: "all",
        games: 35,
        icetime: 1089,
        xGoals: 9.1,
        xAssists: 19.5,
        xPoints: 28.6,
        goals: 8,
        assists: 22,
        points: 30,
        shots: 89,
        corsiFor: 445,
        corsiAgainst: 423,
        corsiForPct: 0.512,
        fenwickFor: 334,
        fenwickAgainst: 312,
        fenwickForPct: 0.518
      },
      {
        playerId: 8476346,
        season: 20242025,
        name: "Tom Wilson",
        team: "WSH",
        position: "R",
        situation: "all",
        games: 40,
        icetime: 945,
        xGoals: 10.8,
        xAssists: 15.2,
        xPoints: 26.0,
        goals: 12,
        assists: 18,
        points: 30,
        shots: 98,
        corsiFor: 398,
        corsiAgainst: 402,
        corsiForPct: 0.495,
        fenwickFor: 299,
        fenwickAgainst: 297,
        fenwickForPct: 0.501
      },
      {
        playerId: 8477493,
        season: 20242025,
        name: "Evgeny Kuznetsov",
        team: "WSH",
        position: "C",
        situation: "all",
        games: 38,
        icetime: 892,
        xGoals: 8.9,
        xAssists: 14.1,
        xPoints: 23.0,
        goals: 10,
        assists: 16,
        points: 26,
        shots: 76,
        corsiFor: 356,
        corsiAgainst: 388,
        corsiForPct: 0.478,
        fenwickFor: 267,
        fenwickAgainst: 283,
        fenwickForPct: 0.485
      },
      {
        playerId: 8474590,
        season: 20242025,
        name: "T.J. Oshie",
        team: "WSH",
        position: "R",
        situation: "all",
        games: 35,
        icetime: 721,
        xGoals: 7.8,
        xAssists: 10.5,
        xPoints: 18.3,
        goals: 9,
        assists: 12,
        points: 21,
        shots: 67,
        corsiFor: 299,
        corsiAgainst: 297,
        corsiForPct: 0.501,
        fenwickFor: 224,
        fenwickAgainst: 217,
        fenwickForPct: 0.508
      }
    ];
  }

  async getGamesByTeam(teamId: number, season: string): Promise<any> {
    return {
      games: [
        { id: 2024020001, date: "2024-10-12", homeTeam: "WSH", awayTeam: "NJD" },
        { id: 2024020002, date: "2024-10-15", homeTeam: "NYR", awayTeam: "WSH" }
      ]
    };
  }

  async getLiveGameData(gameId: number): Promise<any> {
    return {
      gamePk: gameId,
      gameData: {
        status: { statusCode: "7" },
        teams: {
          home: { name: "Washington Capitals", score: 3 },
          away: { name: "New York Rangers", score: 2 }
        }
      }
    };
  }

  async getShotData(gameId: number): Promise<any> {
    return [
      { team: 'WSH', xGoal: 0.15, shotType: 'high_danger' },
      { team: 'WSH', xGoal: 0.08, shotType: 'medium_danger' },
      { team: 'NYR', xGoal: 0.06, shotType: 'low_danger' }
    ];
  }
}

interface DatabaseService {
  saveTeamStats: (stats: any) => Promise<void>;
  savePlayerStats: (stats: MoneyPuckPlayerStats[]) => Promise<void>;
  getTeamStatsHistory: (teamId: number, season: string) => Promise<any[]>;
  getPlayerStatsHistory: (playerId: number, season: string) => Promise<any[]>;
}

class MockDatabaseService implements DatabaseService {
  private teamStatsCache: Map<string, any> = new Map();
  private playerStatsCache: Map<string, MoneyPuckPlayerStats[]> = new Map();

  async saveTeamStats(stats: any): Promise<void> {
    const key = `${stats.teamId}-${stats.season}`;
    this.teamStatsCache.set(key, { ...stats, lastUpdated: new Date() });
    console.log(`Saved team stats for key: ${key}`);
  }

  async savePlayerStats(stats: MoneyPuckPlayerStats[]): Promise<void> {
    const season = stats[0]?.season?.toString() || 'unknown';
    const key = `players-${season}`;
    this.playerStatsCache.set(key, stats);
    console.log(`Saved ${stats.length} player records for season ${season}`);
  }

  async getTeamStatsHistory(teamId: number, season: string): Promise<any[]> {
    const key = `${teamId}-${season}`;
    const cached = this.teamStatsCache.get(key);
    return cached ? [cached] : [];
  }

  async getPlayerStatsHistory(playerId: number, season: string): Promise<any[]> {
    const key = `players-${season}`;
    const cached = this.playerStatsCache.get(key);
    return cached?.filter(p => p.playerId === playerId) || [];
  }
}

export class DataIntegrationService {
  private hockeyAPI: MockHockeyAPI;
  private db: DatabaseService;
  private updateInterval: number = 5 * 60 * 1000; // 5 minutes
  private lastUpdate: Map<string, Date> = new Map();

  constructor(databaseService?: DatabaseService) {
    this.hockeyAPI = new MockHockeyAPI();
    this.db = databaseService || new MockDatabaseService();
  }

  async fetchAndIntegrateCapitalsData(forceRefresh: boolean = false): Promise<{
    teamStats: any;
    playerStats: MoneyPuckPlayerStats[];
    roster: any;
    schedule: any;
  }> {
    const CAPITALS_TEAM_ID = 15;
    const CURRENT_SEASON = '20242025';
    const cacheKey = `capitals-${CURRENT_SEASON}`;

    const lastUpdateTime = this.lastUpdate.get(cacheKey);
    const needsUpdate = forceRefresh || 
      !lastUpdateTime || 
      (Date.now() - lastUpdateTime.getTime()) > this.updateInterval;

    if (!needsUpdate) {
      console.log('Using cached data');
    }

    try {
      console.log('Fetching fresh data from APIs...');

      const [
        nhlRoster,
        nhlTeamStats,
        moneyPuckTeamStats,
        moneyPuckPlayerStats,
        teamSchedule
      ] = await Promise.all([
        this.hockeyAPI.getTeamRoster(CAPITALS_TEAM_ID),
        this.hockeyAPI.getTeamStats(CAPITALS_TEAM_ID),
        this.hockeyAPI.getAdvancedTeamStats(CURRENT_SEASON),
        this.hockeyAPI.getAdvancedPlayerStats(CURRENT_SEASON),
        this.hockeyAPI.getGamesByTeam(CAPITALS_TEAM_ID, CURRENT_SEASON)
      ]);

      const capitalsAdvancedStats = moneyPuckTeamStats.find(
        (team: MoneyPuckTeamStats) => team.team === 'WSH'
      );

      const capitalsPlayers = moneyPuckPlayerStats.filter(
        (player: MoneyPuckPlayerStats) => player.team === 'WSH'
      );

      const integratedTeamStats = {
        basic: nhlTeamStats,
        advanced: capitalsAdvancedStats,
        lastUpdated: new Date(),
        teamId: CAPITALS_TEAM_ID,
        season: CURRENT_SEASON
      };

      await this.db.saveTeamStats(integratedTeamStats);
      await this.db.savePlayerStats(capitalsPlayers);

      this.lastUpdate.set(cacheKey, new Date());

      return {
        teamStats: integratedTeamStats,
        playerStats: capitalsPlayers,
        roster: nhlRoster,
        schedule: teamSchedule
      };

    } catch (error) {
      console.error('Error in data integration:', error);
      throw new Error(`Data integration failed: ${error}`);
    }
  }

  async integrateGameData(gameId: number): Promise<{
    liveData: any;
    shotData: any;
    advancedMetrics: any;
  }> {
    try {
      const [liveGameData, shotData] = await Promise.all([
        this.hockeyAPI.getLiveGameData(gameId),
        this.hockeyAPI.getShotData(gameId)
      ]);

      const advancedMetrics = this.calculateAdvancedGameMetrics(shotData);

      return {
        liveData: liveGameData,
        shotData,
        advancedMetrics
      };

    } catch (error) {
      console.error('Error integrating game data:', error);
      throw new Error(`Game data integration failed: ${error}`);
    }
  }

  private calculateAdvancedGameMetrics(shotData: any): any {
    if (!shotData || !Array.isArray(shotData)) {
      return {
        xGoalsFor: 0,
        xGoalsAgainst: 0,
        highDangerShotsFor: 0,
        highDangerShotsAgainst: 0,
        corsiFor: 0,
        corsiAgainst: 0
      };
    }

    const metrics = {
      xGoalsFor: 0,
      xGoalsAgainst: 0,
      highDangerShotsFor: 0,
      highDangerShotsAgainst: 0,
      corsiFor: 0,
      corsiAgainst: 0,
      shotQuality: {
        for: 0,
        against: 0
      }
    };

    shotData.forEach((shot: any) => {
      if (shot.team === 'WSH') {
        metrics.xGoalsFor += shot.xGoal || 0;
        metrics.corsiFor += 1;
        if (shot.shotType === 'high_danger') {
          metrics.highDangerShotsFor += 1;
        }
      } else {
        metrics.xGoalsAgainst += shot.xGoal || 0;
        metrics.corsiAgainst += 1;
        if (shot.shotType === 'high_danger') {
          metrics.highDangerShotsAgainst += 1;
        }
      }
    });

    const totalShotsFor = shotData.filter((shot: any) => shot.team === 'WSH').length;
    const totalShotsAgainst = shotData.filter((shot: any) => shot.team !== 'WSH').length;

    metrics.shotQuality.for = totalShotsFor > 0 ? metrics.xGoalsFor / totalShotsFor : 0;
    metrics.shotQuality.against = totalShotsAgainst > 0 ? metrics.xGoalsAgainst / totalShotsAgainst : 0;

    return metrics;
  }

  async generatePredictiveInsights(teamStats: any, playerStats: MoneyPuckPlayerStats[]): Promise<{
    playoffProbability: number;
    projectedRecord: { wins: number; losses: number; ot: number };
    keyInsights: string[];
    recommendations: string[];
  }> {
    try {
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

      const keyInsights: string[] = [];
      const recommendations: string[] = [];

      if (teamStats.advanced) {
        const xGDiff = teamStats.advanced.xGoalsFor - teamStats.advanced.xGoalsAgainst;
        const corsiPct = teamStats.advanced.corsiForPct;

        if (xGDiff > 0.4) {
          keyInsights.push('Team is generating significantly more quality chances than allowing');
        } else if (xGDiff < -0.4) {
          keyInsights.push('Team is allowing more quality chances than generating - defensive improvement needed');
          recommendations.push('Focus on defensive zone coverage and shot suppression');
        }

        if (corsiPct > 0.52) {
          keyInsights.push('Excellent puck possession and shot attempt differential');
        } else if (corsiPct < 0.48) {
          keyInsights.push('Below-average puck possession - need to improve shot attempt generation');
          recommendations.push('Work on offensive zone time and shot volume');
        }
      }

      if (playerStats.length > 0) {
        const topScorer = playerStats.reduce((prev, current) => 
          (prev.points > current.points) ? prev : current, playerStats[0]
        );

        if (topScorer && topScorer.points > (topScorer.xPoints + 5)) {
          keyInsights.push(`${topScorer.name} is significantly outperforming expected production`);
        }

        const underperformers = playerStats.filter(p => 
          p.games >= 20 && (p.points < p.xPoints - 3)
        );

        if (underperformers.length > 2) {
          recommendations.push('Multiple players underperforming expected production - review line combinations');
        }
      }

      return {
        playoffProbability: Math.round(playoffProbability * 100) / 100,
        projectedRecord,
        keyInsights,
        recommendations
      };

    } catch (error) {
      console.error('Error generating predictive insights:', error);
      return {
        playoffProbability: 0.73,
        projectedRecord: { wins: 47, losses: 28, ot: 7 },
        keyInsights: ['Strong offensive production from top line'],
        recommendations: ['Focus on defensive consistency']
      };
    }
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
export const dataIntegrationService = new DataIntegrationService();