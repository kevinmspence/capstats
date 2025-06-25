// src/services/historicalDataService.ts
import axios from 'axios';

interface HistoricalSeason {
  season: string;
  seasonId: number;
  displayName: string;
  startYear: number;
  endYear: number;
}

interface HistoricalProgress {
  totalSeasons: number;
  completedSeasons: number;
  currentSeason: string;
  progress: number;
  estimatedTimeRemaining: string;
}

class HistoricalDataService {
  private readonly MONEYPUCK_BASE = 'https://moneypuck.com/moneypuck/playerData';
  private readonly NHL_SEASONS_START = 2008; // 2008-2009 season
  private readonly CURRENT_YEAR = new Date().getFullYear();
  
  private cache = new Map<string, any>();
  private progress: HistoricalProgress = {
    totalSeasons: 0,
    completedSeasons: 0,
    currentSeason: '',
    progress: 0,
    estimatedTimeRemaining: ''
  };

  /**
   * Generate all seasons from 2008-2009 to current
   */
  private generateSeasons(): HistoricalSeason[] {
    const seasons: HistoricalSeason[] = [];
    
    for (let year = this.NHL_SEASONS_START; year < this.CURRENT_YEAR; year++) {
      seasons.push({
        season: `${year}${year + 1}`,
        seasonId: year,
        displayName: `${year}-${year + 1}`,
        startYear: year,
        endYear: year + 1
      });
    }
    
    return seasons;
  }

  /**
   * Fetch historical data for a specific season
   */
  private async fetchSeasonData(season: HistoricalSeason) {
    const seasonStr = season.startYear.toString(); // MoneyPuck uses start year
    
    try {
      console.log(`📚 Fetching ${season.displayName} season data...`);
      
      const [teamData, playerData, goalieData] = await Promise.all([
        axios.get(`${this.MONEYPUCK_BASE}/teams/${seasonStr}/regular`),
        axios.get(`${this.MONEYPUCK_BASE}/skaters/${seasonStr}/regular`),
        axios.get(`${this.MONEYPUCK_BASE}/goalies/${seasonStr}/regular`)
      ]);

      // Filter for Capitals data
      const capitalsTeam = teamData.data.find((team: any) => team.team === 'WSH');
      const capitalsPlayers = playerData.data.filter((player: any) => player.team === 'WSH');
      const capitalsGoalies = goalieData.data.filter((goalie: any) => goalie.team === 'WSH');

      const seasonData = {
        season: season.displayName,
        seasonId: season.seasonId,
        team: capitalsTeam,
        players: capitalsPlayers,
        goalies: capitalsGoalies,
        fetchedAt: new Date().toISOString()
      };

      // Cache the data
      this.cache.set(season.season, seasonData);
      
      return seasonData;
      
    } catch (error) {
      console.error(`❌ Failed to fetch ${season.displayName}:`, error);
      return null;
    }
  }

  /**
   * Backfill all historical data with progress tracking
   */
  async backfillHistoricalData(
    onProgress?: (progress: HistoricalProgress) => void,
    onSeasonComplete?: (seasonData: any) => void
  ): Promise<Map<string, any>> {
    const seasons = this.generateSeasons();
    
    this.progress = {
      totalSeasons: seasons.length,
      completedSeasons: 0,
      currentSeason: '',
      progress: 0,
      estimatedTimeRemaining: 'Calculating...'
    };

    console.log(`🚀 Starting historical backfill: ${seasons.length} seasons (${seasons[0].displayName} to ${seasons[seasons.length - 1].displayName})`);
    
    const startTime = Date.now();
    
    for (let i = 0; i < seasons.length; i++) {
      const season = seasons[i];
      
      // Update progress
      this.progress.currentSeason = season.displayName;
      this.progress.completedSeasons = i;
      this.progress.progress = (i / seasons.length) * 100;
      
      // Calculate estimated time remaining
      const elapsed = Date.now() - startTime;
      const averageTimePerSeason = elapsed / Math.max(i, 1);
      const remainingSeasons = seasons.length - i;
      const estimatedRemaining = (remainingSeasons * averageTimePerSeason) / 1000 / 60; // minutes
      this.progress.estimatedTimeRemaining = `${Math.ceil(estimatedRemaining)} minutes`;
      
      if (onProgress) {
        onProgress({ ...this.progress });
      }

      // Fetch season data
      const seasonData = await this.fetchSeasonData(season);
      
      if (seasonData && onSeasonComplete) {
        onSeasonComplete(seasonData);
      }

      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Final progress update
    this.progress.completedSeasons = seasons.length;
    this.progress.progress = 100;
    this.progress.estimatedTimeRemaining = 'Complete!';
    this.progress.currentSeason = 'Finished';
    
    if (onProgress) {
      onProgress({ ...this.progress });
    }

    console.log(`✅ Historical backfill complete! ${seasons.length} seasons loaded.`);
    return this.cache;
  }

  /**
   * Get historical data for analysis
   */
  getHistoricalAnalysis() {
    const allSeasons = Array.from(this.cache.values());
    
    if (allSeasons.length === 0) {
      return null;
    }

    // Ovechkin's career progression
    const ovechkinProgression = allSeasons
      .map(season => {
        const ovechkin = season.players?.find((p: any) => 
          p.name?.toLowerCase().includes('ovechkin') || 
          p.name?.toLowerCase().includes('alexander')
        );
        return ovechkin ? {
          season: season.season,
          goals: ovechkin.goals || 0,
          points: ovechkin.points || 0,
          xGoals: ovechkin.xGoals || 0,
          shots: ovechkin.shots || 0
        } : null;
      })
      .filter(Boolean);

    // Team performance over time
    const teamProgression = allSeasons
      .map(season => ({
        season: season.season,
        goalsFor: season.team?.goalsFor || 0,
        goalsAgainst: season.team?.goalsAgainst || 0,
        corsiFor: season.team?.corsiForPct || 0,
        xGoalsFor: season.team?.xGoalsFor || 0,
        games: season.team?.games || 0
      }))
      .filter(season => season.games > 0);

    // Stanley Cup season (2017-2018) analysis
    const cupSeason = allSeasons.find(season => season.season === '2017-2018');

    // Best and worst seasons
    const bestSeason = teamProgression.reduce((best, current) => 
      (current.goalsFor / current.games) > (best.goalsFor / best.games) ? current : best
    );

    const worstSeason = teamProgression.reduce((worst, current) => 
      (current.goalsFor / current.games) < (worst.goalsFor / worst.games) ? current : worst
    );

    return {
      totalSeasons: allSeasons.length,
      ovechkinProgression,
      teamProgression,
      cupSeason,
      bestSeason,
      worstSeason,
      insights: this.generateHistoricalInsights(allSeasons, ovechkinProgression, teamProgression)
    };
  }

  /**
   * Generate insights from historical data
   */
  private generateHistoricalInsights(allSeasons: any[], ovechkinProgression: any[], teamProgression: any[]) {
    const insights = [];

    // Ovechkin insights
    if (ovechkinProgression.length > 0) {
      const totalGoals = ovechkinProgression.reduce((sum, season) => sum + season.goals, 0);
      const best50GoalSeasons = ovechkinProgression.filter(season => season.goals >= 50).length;
      
      insights.push(`Ovechkin has scored ${totalGoals} goals over ${ovechkinProgression.length} seasons`);
      insights.push(`${best50GoalSeasons} seasons with 50+ goals`);
    }

    // Team consistency
    if (teamProgression.length > 0) {
      const avgGoalsFor = teamProgression.reduce((sum, season) => 
        sum + (season.goalsFor / season.games), 0) / teamProgression.length;
      
      insights.push(`Average goals per game over ${teamProgression.length} seasons: ${avgGoalsFor.toFixed(2)}`);
    }

    // Era analysis
    const earlySeasons = teamProgression.filter(season => 
      parseInt(season.season.split('-')[0]) < 2015);
    const recentSeasons = teamProgression.filter(season => 
      parseInt(season.season.split('-')[0]) >= 2015);

    if (earlySeasons.length > 0 && recentSeasons.length > 0) {
      const earlyAvg = earlySeasons.reduce((sum, s) => sum + s.goalsFor / s.games, 0) / earlySeasons.length;
      const recentAvg = recentSeasons.reduce((sum, s) => sum + s.goalsFor / s.games, 0) / recentSeasons.length;
      
      if (recentAvg > earlyAvg) {
        insights.push('Offensive production has improved in recent years');
      } else {
        insights.push('Team was more offensive in earlier years');
      }
    }

    return insights;
  }

  /**
   * Get cached seasons
   */
  getCachedSeasons(): string[] {
    return Array.from(this.cache.keys()).sort();
  }

  /**
   * Get specific season data
   */
  getSeasonData(season: string): any {
    return this.cache.get(season);
  }

  /**
   * Get current progress
   */
  getProgress(): HistoricalProgress {
    return { ...this.progress };
  }

  /**
   * Export all historical data for database storage
   */
  exportHistoricalData(): any[] {
    return Array.from(this.cache.values());
  }

  /**
   * Check if backfill is needed
   */
  needsBackfill(): boolean {
    const expectedSeasons = this.generateSeasons().length;
    return this.cache.size < expectedSeasons;
  }
}

// Export singleton
export const historicalDataService = new HistoricalDataService();