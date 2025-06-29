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
  private readonly NHL_SEASONS_START = 2008;
  private readonly CURRENT_YEAR = new Date().getFullYear();
  
  private cache = new Map<string, any>();
  private progress: HistoricalProgress = {
    totalSeasons: 0,
    completedSeasons: 0,
    currentSeason: '',
    progress: 0,
    estimatedTimeRemaining: ''
  };

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

  private parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        if (value && !isNaN(Number(value)) && value !== '') {
          row[header] = Number(value);
        } else {
          row[header] = value;
        }
      });
      
      data.push(row);
    }
    
    return data;
  }

  private async fetchCSVData(url: string): Promise<any[]> {
    try {
      console.log(`📥 Downloading CSV: ${url}`);
      const response = await axios.get(url, { 
        timeout: 30000,
        headers: {
          'User-Agent': 'NHL-Analytics-Dashboard/1.0'
        }
      });
      
      if (response.data) {
        return this.parseCSV(response.data);
      }
      
      return [];
    } catch (error: any) {
      console.error(`❌ Failed to fetch CSV from ${url}:`, error?.message || 'Unknown error');
      return [];
    }
  }

  private async fetchSeasonData(season: HistoricalSeason) {
    const seasonStr = season.startYear.toString();
    
    try {
      console.log(`📚 Fetching ${season.displayName} season data...`);
      
      // Use the CORRECT MoneyPuck CSV URL structure
      const baseUrl = 'https://moneypuck.com/moneypuck/playerData/seasonSummary';
      const urls = {
        teams: `${baseUrl}/${seasonStr}/regular/teams.csv`,
        skaters: `${baseUrl}/${seasonStr}/regular/skaters.csv`,
        goalies: `${baseUrl}/${seasonStr}/regular/goalies.csv`
      };

      console.log(`  📊 Teams: ${urls.teams}`);
      const teamData = await this.fetchCSVData(urls.teams);
      
      console.log(`  🏒 Skaters: ${urls.skaters}`);
      const playerData = await this.fetchCSVData(urls.skaters);
      
      console.log(`  🥅 Goalies: ${urls.goalies}`);
      const goalieData = await this.fetchCSVData(urls.goalies);

      // Filter for Capitals data
      const teamAbbreviations = ['WSH', 'WAS', 'Washington', 'WASHINGTON'];
      
      const capitalsTeam = teamData.find((team: any) => 
        teamAbbreviations.some(abbr => 
          team.team?.toUpperCase() === abbr || 
          team.Team?.toUpperCase() === abbr ||
          team.name?.toUpperCase().includes('WASHINGTON')
        )
      );
      
      const capitalsPlayers = playerData.filter((player: any) => 
        teamAbbreviations.some(abbr => 
          player.team?.toUpperCase() === abbr || 
          player.Team?.toUpperCase() === abbr
        )
      );
      
      const capitalsGoalies = goalieData.filter((goalie: any) => 
        teamAbbreviations.some(abbr => 
          goalie.team?.toUpperCase() === abbr || 
          goalie.Team?.toUpperCase() === abbr
        )
      );

      const seasonData = {
        season: season.displayName,
        seasonId: season.seasonId,
        team: capitalsTeam,
        players: capitalsPlayers,
        goalies: capitalsGoalies,
        fetchedAt: new Date().toISOString(),
        dataAvailable: {
          team: teamData.length > 0,
          players: playerData.length > 0,
          goalies: goalieData.length > 0
        }
      };

      this.cache.set(season.season, seasonData);
      
      console.log(`✅ Fetched ${season.displayName}: Team=${!!capitalsTeam}, Players=${capitalsPlayers.length}, Goalies=${capitalsGoalies.length}`);
      
      return seasonData;
      
    } catch (error) {
      console.error(`❌ Failed to fetch ${season.displayName}:`, error);
      return null;
    }
  }

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
    console.log('📄 Using CSV file downloads from MoneyPuck');
    
    const startTime = Date.now();
    
    for (let i = 0; i < seasons.length; i++) {
      const season = seasons[i];
      
      this.progress.currentSeason = season.displayName;
      this.progress.completedSeasons = i;
      this.progress.progress = (i / seasons.length) * 100;
      
      const elapsed = Date.now() - startTime;
      const averageTimePerSeason = elapsed / Math.max(i, 1);
      const remainingSeasons = seasons.length - i;
      const estimatedRemaining = (remainingSeasons * averageTimePerSeason) / 1000 / 60;
      this.progress.estimatedTimeRemaining = `${Math.ceil(estimatedRemaining)} minutes`;
      
      if (onProgress) {
        onProgress({ ...this.progress });
      }

      const seasonData = await this.fetchSeasonData(season);
      
      if (seasonData && onSeasonComplete) {
        onSeasonComplete(seasonData);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

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

  getHistoricalAnalysis() {
    const allSeasons = Array.from(this.cache.values());
    
    if (allSeasons.length === 0) {
      return null;
    }

    const seasonsWithData = allSeasons.filter(season => 
      season.dataAvailable.team || 
      season.dataAvailable.players || 
      season.dataAvailable.goalies
    );

    if (seasonsWithData.length === 0) {
      return null;
    }

    const ovechkinProgression = seasonsWithData
      .map(season => {
        if (!season.players || !Array.isArray(season.players)) return null;
        
        const ovechkin = season.players.find((p: any) => 
          p?.name?.toLowerCase().includes('ovechkin') || 
          p?.lastName?.toLowerCase().includes('ovechkin') ||
          p?.player?.toLowerCase().includes('ovechkin')
        );
        
        if (!ovechkin) return null;
        
        return {
          season: season.season,
          goals: ovechkin.goals || ovechkin.G || 0,
          assists: ovechkin.assists || ovechkin.A || 0,
          points: ovechkin.points || ovechkin.PTS || (ovechkin.goals || 0) + (ovechkin.assists || 0),
          games: ovechkin.games || ovechkin.GP || 0,
          shots: ovechkin.shots || ovechkin.S || 0
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.season.localeCompare(b.season));

    const teamProgression = seasonsWithData
      .map(season => {
        if (!season.team) return null;
        
        return {
          season: season.season,
          goalsFor: season.team.goalsFor || season.team.GF || 0,
          goalsAgainst: season.team.goalsAgainst || season.team.GA || 0,
          games: season.team.games || season.team.GP || 82,
          wins: season.team.wins || season.team.W || 0,
          losses: season.team.losses || season.team.L || 0
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.season.localeCompare(b.season));

    return {
      totalSeasons: seasonsWithData.length,
      ovechkinProgression,
      teamProgression,
      insights: [`Successfully loaded ${seasonsWithData.length} seasons of historical data from MoneyPuck CSV files`]
    };
  }

  getCachedSeasons(): string[] {
    return Array.from(this.cache.keys()).sort();
  }

  getSeasonData(season: string): any {
    return this.cache.get(season);
  }

  getProgress(): HistoricalProgress {
    return { ...this.progress };
  }

  exportHistoricalData(): any[] {
    return Array.from(this.cache.values());
  }

  needsBackfill(): boolean {
    const expectedSeasons = this.generateSeasons().length;
    return this.cache.size < expectedSeasons;
  }
}

export const historicalDataService = new HistoricalDataService();