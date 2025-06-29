// src/services/completeDataBackfillService.ts
import { Pool } from 'pg';

interface CompleteBackfillProgress {
  currentStep: string;
  progress: number;
  totalSteps: number;
  errors: string[];
  completed: string[];
  startTime: Date;
  estimatedTimeRemaining?: number;
  tablesPopulated: {
    teams: boolean;
    players: boolean;
    games: boolean;
    player_game_stats: boolean;
    player_season_stats: boolean;
    team_game_stats: boolean;
    team_season_stats: boolean;
    goalie_game_stats: boolean;
    shots: boolean;
  };
}

class CompleteDataBackfillService {
  private pool: Pool;
  private progress: CompleteBackfillProgress;
  private isRunning = false;
  
  // API endpoints
  private readonly NHL_API_BASE = 'https://api-web.nhle.com/v1';
  private readonly NHL_STATS_API = 'https://api.nhle.com/stats/rest/en';
  private readonly MONEYPUCK_BASE = 'https://moneypuck.com/moneypuck/playerData';
  private readonly CAPITALS_TEAM_ID = 15;

  constructor(pool: Pool) {
    this.pool = pool;
    this.progress = {
      currentStep: 'Ready',
      progress: 0,
      totalSteps: 0,
      errors: [],
      completed: [],
      startTime: new Date(),
      tablesPopulated: {
        teams: false,
        players: false,
        games: false,
        player_game_stats: false,
        player_season_stats: false,
        team_game_stats: false,
        team_season_stats: false,
        goalie_game_stats: false,
        shots: false,
      }
    };
  }

  /**
   * Complete backfill orchestrator - populates ALL schema tables
   */
  async startCompleteBackfill(seasons: string[] = ['20232024'], includePlayoffs: boolean = true): Promise<void> {
    if (this.isRunning) {
      throw new Error('Backfill already in progress');
    }

    this.isRunning = true;
    this.progress.totalSteps = this.calculateTotalSteps(seasons, includePlayoffs);
    this.progress.startTime = new Date();

    try {
      console.log('🚀 Starting Complete Database Backfill');
      console.log(`📊 Will populate ${Object.keys(this.progress.tablesPopulated).length} tables`);
      
      // Step 1: Foundation - Teams
      await this.backfillAllTeams();
      
      // Step 2: Foundation - Players for each season
      for (const season of seasons) {
        await this.backfillAllPlayersForSeason(season);
      }
      
      // Step 3: Games with complete details
      for (const season of seasons) {
        await this.backfillCompleteGamesForSeason(season, includePlayoffs);
      }
      
      // Step 4: Player game statistics (detailed)
      for (const season of seasons) {
        await this.backfillPlayerGameStats(season);
      }
      
      // Step 5: Goalie game statistics
      for (const season of seasons) {
        await this.backfillGoalieGameStats(season);
      }
      
      // Step 6: Team game statistics (advanced)
      for (const season of seasons) {
        await this.backfillTeamGameStats(season);
      }
      
      // Step 7: Shot-by-shot data
      for (const season of seasons) {
        await this.backfillShotData(season);
      }
      
      // Step 8: Season aggregations
      for (const season of seasons) {
        await this.calculatePlayerSeasonStats(season);
        await this.calculateTeamSeasonStats(season);
      }
      
      // Step 9: Advanced stats from MoneyPuck
      for (const season of seasons) {
        await this.backfillMoneyPuckAdvancedStats(season);
      }
      
      this.progress.currentStep = 'Completed Successfully';
      console.log('✅ Complete backfill finished!');
      await this.generateBackfillReport();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.progress.errors.push(`Complete backfill failed: ${errorMessage}`);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Step 1: Backfill all teams with complete data
   */
  private async backfillAllTeams(): Promise<void> {
    this.updateProgress('Fetching all NHL teams');
    
    try {
      const response = await fetch(`${this.NHL_API_BASE}/standings/now`);
      const standingsData = await response.json();
      
      // Also get detailed team info
      const teamsResponse = await fetch(`${this.NHL_STATS_API}/team`);
      const teamsData = await teamsResponse.json();
      
      for (const standing of standingsData.standings) {
        const team = teamsData.data.find((t: any) => t.id === standing.teamAbbrev.default);
        if (team) {
          await this.insertCompleteTeamData(standing, team);
        }
      }
      
      this.progress.tablesPopulated.teams = true;
      this.progress.completed.push('All teams with complete data');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.progress.errors.push(`Teams backfill failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Step 2: Backfill all players for a season with complete biographical data
   */
  private async backfillAllPlayersForSeason(season: string): Promise<void> {
    this.updateProgress(`Fetching all players for ${season}`);
    
    try {
      // Get all players from roster endpoint
      const playersResponse = await fetch(
        `${this.NHL_STATS_API}/skater/summary?limit=1000&cayenneExp=seasonId=${season}`
      );
      const playersData = await playersResponse.json();
      
      for (const player of playersData.data) {
        // Get detailed player bio
        const playerDetailResponse = await fetch(`${this.NHL_API_BASE}/player/${player.playerId}/landing`);
        if (playerDetailResponse.ok) {
          const playerDetail = await playerDetailResponse.json();
          await this.insertCompletePlayerData(player, playerDetail, season);
        }
        
        // Rate limiting
        await this.delay(50);
      }
      
      // Also get goalies
      const goaliesResponse = await fetch(
        `${this.NHL_STATS_API}/goalie/summary?limit=200&cayenneExp=seasonId=${season}`
      );
      const goaliesData = await goaliesResponse.json();
      
      for (const goalie of goaliesData.data) {
        const goalieDetailResponse = await fetch(`${this.NHL_API_BASE}/player/${goalie.playerId}/landing`);
        if (goalieDetailResponse.ok) {
          const goalieDetail = await goalieDetailResponse.json();
          await this.insertCompletePlayerData(goalie, goalieDetail, season);
        }
        await this.delay(50);
      }
      
      this.progress.tablesPopulated.players = true;
      this.progress.completed.push(`All players for ${season}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.progress.errors.push(`Players backfill failed for ${season}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Step 3: Backfill games with complete details
   */
  private async backfillCompleteGamesForSeason(season: string, includePlayoffs: boolean): Promise<void> {
    this.updateProgress(`Fetching complete games for ${season}`);
    
    try {
      // Get schedule
      const gameTypes = includePlayoffs ? ['02', '03'] : ['02'];
      
      for (const gameType of gameTypes) {
        const scheduleResponse = await fetch(
          `${this.NHL_API_BASE}/schedule/${season}/${gameType}`
        );
        
        if (scheduleResponse.ok) {
          const schedule = await scheduleResponse.json();
          
          for (const week of schedule.gameWeek || []) {
            for (const game of week.games || []) {
              await this.insertCompleteGameData(game, season);
              await this.delay(100);
            }
          }
        }
      }
      
      this.progress.tablesPopulated.games = true;
      this.progress.completed.push(`Complete games for ${season}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.progress.errors.push(`Games backfill failed for ${season}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Step 4: Backfill detailed player game statistics
   */
  private async backfillPlayerGameStats(season: string): Promise<void> {
    this.updateProgress(`Fetching player game stats for ${season}`);
    
    try {
      // Get all completed games for the season
      const gamesQuery = `
        SELECT id FROM games 
        WHERE season = $1 AND game_state = 'Final'
        ORDER BY date_time
      `;
      const gamesResult = await this.executeQuery(gamesQuery, [season]);
      
      for (const game of gamesResult.rows) {
        const boxscoreResponse = await fetch(`${this.NHL_API_BASE}/gamecenter/${game.id}/boxscore`);
        
        if (boxscoreResponse.ok) {
          const boxscore = await boxscoreResponse.json();
          await this.processCompletePlayerGameStats(game.id, boxscore);
        }
        
        await this.delay(200);
      }
      
      this.progress.tablesPopulated.player_game_stats = true;
      this.progress.completed.push(`Player game stats for ${season}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.progress.errors.push(`Player game stats failed for ${season}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Step 5: Backfill goalie game statistics
   */
  private async backfillGoalieGameStats(season: string): Promise<void> {
    this.updateProgress(`Fetching goalie game stats for ${season}`);
    
    try {
      const gamesQuery = `
        SELECT id FROM games 
        WHERE season = $1 AND game_state = 'Final'
        ORDER BY date_time
      `;
      const gamesResult = await this.executeQuery(gamesQuery, [season]);
      
      for (const game of gamesResult.rows) {
        const boxscoreResponse = await fetch(`${this.NHL_API_BASE}/gamecenter/${game.id}/boxscore`);
        
        if (boxscoreResponse.ok) {
          const boxscore = await boxscoreResponse.json();
          await this.processGoalieGameStats(game.id, boxscore);
        }
        
        await this.delay(200);
      }
      
      this.progress.tablesPopulated.goalie_game_stats = true;
      this.progress.completed.push(`Goalie game stats for ${season}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.progress.errors.push(`Goalie game stats failed for ${season}: ${errorMessage}`);
    }
  }

  /**
   * Step 6: Backfill team game statistics
   */
  private async backfillTeamGameStats(season: string): Promise<void> {
    this.updateProgress(`Fetching team game stats for ${season}`);
    
    try {
      const gamesQuery = `
        SELECT id FROM games 
        WHERE season = $1 AND game_state = 'Final'
        ORDER BY date_time
      `;
      const gamesResult = await this.executeQuery(gamesQuery, [season]);
      
      for (const game of gamesResult.rows) {
        const boxscoreResponse = await fetch(`${this.NHL_API_BASE}/gamecenter/${game.id}/boxscore`);
        
        if (boxscoreResponse.ok) {
          const boxscore = await boxscoreResponse.json();
          await this.processTeamGameStats(game.id, boxscore);
        }
        
        await this.delay(200);
      }
      
      this.progress.tablesPopulated.team_game_stats = true;
      this.progress.completed.push(`Team game stats for ${season}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.progress.errors.push(`Team game stats failed for ${season}: ${errorMessage}`);
    }
  }

  /**
   * Step 7: Backfill shot-by-shot data
   */
  private async backfillShotData(season: string): Promise<void> {
    this.updateProgress(`Fetching shot data for ${season}`);
    
    try {
      // Focus on Capitals games for shot data (due to API limitations)
      const capsGamesQuery = `
        SELECT id FROM games 
        WHERE season = $1 AND game_state = 'Final'
        AND (home_team_id = $2 OR away_team_id = $2)
        ORDER BY date_time
      `;
      const gamesResult = await this.executeQuery(capsGamesQuery, [season, this.CAPITALS_TEAM_ID]);
      
      for (const game of gamesResult.rows) {
        const playByPlayResponse = await fetch(`${this.NHL_API_BASE}/gamecenter/${game.id}/play-by-play`);
        
        if (playByPlayResponse.ok) {
          const playByPlay = await playByPlayResponse.json();
          await this.processShotData(game.id, playByPlay);
        }
        
        await this.delay(300);
      }
      
      this.progress.tablesPopulated.shots = true;
      this.progress.completed.push(`Shot data for ${season}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.progress.errors.push(`Shot data failed for ${season}: ${errorMessage}`);
    }
  }

  /**
   * Step 8: Calculate season statistics aggregations
   */
  private async calculatePlayerSeasonStats(season: string): Promise<void> {
    this.updateProgress(`Calculating player season stats for ${season}`);
    
    try {
      const aggregationQuery = `
        INSERT INTO player_season_stats (
          player_id, season, team_id, games_played, goals, assists, points,
          plus_minus, penalty_minutes, shots, shooting_percentage,
          time_on_ice_total_seconds, time_on_ice_avg_seconds,
          powerplay_time_total_seconds, shorthanded_time_total_seconds
        )
        SELECT 
          player_id,
          $1 as season,
          team_id,
          COUNT(*) as games_played,
          SUM(goals) as goals,
          SUM(assists) as assists,
          SUM(points) as points,
          SUM(plus_minus) as plus_minus,
          SUM(penalty_minutes) as penalty_minutes,
          SUM(shots) as shots,
          CASE 
            WHEN SUM(shots) > 0 THEN (SUM(goals)::NUMERIC / SUM(shots) * 100)
            ELSE 0 
          END as shooting_percentage,
          SUM(time_on_ice_seconds) as time_on_ice_total_seconds,
          AVG(time_on_ice_seconds) as time_on_ice_avg_seconds,
          SUM(powerplay_time_seconds) as powerplay_time_total_seconds,
          SUM(shorthanded_time_seconds) as shorthanded_time_total_seconds
        FROM player_game_stats pgs
        JOIN games g ON pgs.game_id = g.id
        WHERE g.season = $1
        GROUP BY player_id, team_id
        ON CONFLICT (player_id, season, team_id) 
        DO UPDATE SET
          games_played = EXCLUDED.games_played,
          goals = EXCLUDED.goals,
          assists = EXCLUDED.assists,
          points = EXCLUDED.points,
          plus_minus = EXCLUDED.plus_minus,
          penalty_minutes = EXCLUDED.penalty_minutes,
          shots = EXCLUDED.shots,
          shooting_percentage = EXCLUDED.shooting_percentage,
          time_on_ice_total_seconds = EXCLUDED.time_on_ice_total_seconds,
          time_on_ice_avg_seconds = EXCLUDED.time_on_ice_avg_seconds,
          powerplay_time_total_seconds = EXCLUDED.powerplay_time_total_seconds,
          shorthanded_time_total_seconds = EXCLUDED.shorthanded_time_total_seconds,
          updated_at = CURRENT_TIMESTAMP;
      `;
      
      await this.executeQuery(aggregationQuery, [season]);
      
      this.progress.tablesPopulated.player_season_stats = true;
      this.progress.completed.push(`Player season aggregations for ${season}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.progress.errors.push(`Player season stats calculation failed: ${errorMessage}`);
    }
  }

  /**
   * Calculate team season statistics
   */
  private async calculateTeamSeasonStats(season: string): Promise<void> {
    this.updateProgress(`Calculating team season stats for ${season}`);
    
    try {
      const teams = await this.executeQuery('SELECT id FROM teams');
      
      for (const team of teams.rows) {
        // Calculate wins, losses, points from games
        const recordQuery = `
          SELECT 
            COUNT(*) as games_played,
            SUM(CASE 
              WHEN (is_home AND home_score > away_score) OR (NOT is_home AND away_score > home_score) 
              THEN 1 ELSE 0 
            END) as wins,
            SUM(CASE 
              WHEN (is_home AND home_score < away_score) OR (NOT is_home AND away_score < home_score)
              AND period <= 3 
              THEN 1 ELSE 0 
            END) as losses,
            SUM(CASE 
              WHEN (is_home AND home_score < away_score) OR (NOT is_home AND away_score < home_score)
              AND period > 3 
              THEN 1 ELSE 0 
            END) as overtime_losses,
            SUM(goals) as goals_for,
            SUM(CASE WHEN is_home THEN away_score ELSE home_score END) as goals_against
          FROM team_game_stats tgs
          JOIN games g ON tgs.game_id = g.id
          WHERE tgs.team_id = $1 AND g.season = $2 AND g.game_state = 'Final'
        `;
        
        const recordResult = await this.executeQuery(recordQuery, [team.id, season]);
        const record = recordResult.rows[0];
        
        if (record && record.games_played > 0) {
          const points = (record.wins * 2) + record.overtime_losses;
          
          await this.executeQuery(`
            INSERT INTO team_season_stats (
              team_id, season, games_played, wins, losses, overtime_losses,
              points, goals_for, goals_against, goal_differential
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (team_id, season)
            DO UPDATE SET
              games_played = EXCLUDED.games_played,
              wins = EXCLUDED.wins,
              losses = EXCLUDED.losses,
              overtime_losses = EXCLUDED.overtime_losses,
              points = EXCLUDED.points,
              goals_for = EXCLUDED.goals_for,
              goals_against = EXCLUDED.goals_against,
              goal_differential = EXCLUDED.goal_differential,
              updated_at = CURRENT_TIMESTAMP;
          `, [
            team.id, season, record.games_played, record.wins, record.losses,
            record.overtime_losses, points, record.goals_for, record.goals_against,
            record.goals_for - record.goals_against
          ]);
        }
      }
      
      this.progress.tablesPopulated.team_season_stats = true;
      this.progress.completed.push(`Team season aggregations for ${season}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.progress.errors.push(`Team season stats calculation failed: ${errorMessage}`);
    }
  }

  /**
   * Step 9: Backfill advanced stats from MoneyPuck
   */
  private async backfillMoneyPuckAdvancedStats(season: string): Promise<void> {
    this.updateProgress(`Fetching MoneyPuck advanced stats for ${season}`);
    
    try {
      const seasonNum = parseInt(season.substring(0, 4));
      
      // Get player advanced stats
      const playerStatsUrl = `${this.MONEYPUCK_BASE}/skaters/${seasonNum}/regular/skaters.csv`;
      const playerStats = await this.fetchCSVData(playerStatsUrl);
      
      if (playerStats) {
        await this.updatePlayerAdvancedStats(playerStats, season);
      }
      
      // Get team advanced stats
      const teamStatsUrl = `${this.MONEYPUCK_BASE}/teams/${seasonNum}/regular/teams.csv`;
      const teamStats = await this.fetchCSVData(teamStatsUrl);
      
      if (teamStats) {
        await this.updateTeamAdvancedStats(teamStats, season);
      }
      
      this.progress.completed.push(`MoneyPuck advanced stats for ${season}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.progress.errors.push(`MoneyPuck stats failed for ${season}: ${errorMessage}`);
    }
  }

  /**
   * Database insertion methods
   */
  private async insertCompleteTeamData(standing: any, team: any): Promise<void> {
    const query = `
      INSERT INTO teams (id, name, abbreviation, city, division, conference)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        abbreviation = EXCLUDED.abbreviation,
        city = EXCLUDED.city,
        division = EXCLUDED.division,
        conference = EXCLUDED.conference;
    `;
    
    const values = [
      team.id,
      team.fullName || team.teamName || standing.teamName?.default,
      standing.teamAbbrev?.default || team.abbreviation,
      team.locationName || team.city,
      standing.divisionName || team.division,
      standing.conferenceName || team.conference
    ];
    
    await this.executeQuery(query, values);
  }

  private async insertCompletePlayerData(player: any, playerDetail: any, season: string): Promise<void> {
    // Get current team from the season data
    const currentTeam = player.teamId || playerDetail.currentTeamId;
    
    const query = `
      INSERT INTO players (
        id, team_id, first_name, last_name, position, jersey_number,
        birth_date, birth_city, birth_country, height_inches, weight_lbs, shoots
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id)
      DO UPDATE SET
        team_id = EXCLUDED.team_id,
        position = EXCLUDED.position,
        jersey_number = EXCLUDED.jersey_number;
    `;
    
    const values = [
      player.playerId,
      currentTeam,
      playerDetail.firstName || player.firstName || 'Unknown',
      playerDetail.lastName || player.lastName || 'Unknown',
      playerDetail.position || player.position || 'F',
      playerDetail.sweaterNumber || player.sweaterNumber || null,
      playerDetail.birthDate || null,
      playerDetail.birthCity || null,
      playerDetail.birthCountry || null,
      this.convertHeightToInches(playerDetail.heightInInches),
      playerDetail.weightInPounds || null,
      playerDetail.shootsCatches || null
    ];
    
    await this.executeQuery(query, values);
  }

  /**
   * Utility methods
   */
  private async executeQuery(query: string, values: any[] = []): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(query, values);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Database query failed:', errorMessage);
      console.error('Query:', query);
      console.error('Values:', values);
      throw error;
    } finally {
      client.release();
    }
  }

  private async fetchCSVData(url: string): Promise<any[] | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const csvText = await response.text();
      return this.parseCSV(csvText);
    } catch (error) {
      console.warn(`Failed to fetch CSV from ${url}:`, error);
      return null;
    }
  }

  private parseCSV(csvText: string): any[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim().replace(/"/g, '') || null;
        });
        data.push(row);
      }
    }
    
    return data;
  }

  private convertHeightToInches(heightInInches: number | string | null): number | null {
    if (!heightInInches) return null;
    if (typeof heightInInches === 'number') return heightInInches;
    
    // Handle feet'inches" format
    const heightStr = heightInInches.toString();
    const match = heightStr.match(/(\d+)'?\s*(\d+)"/);
    if (match) {
      return parseInt(match[1]) * 12 + parseInt(match[2]);
    }
    
    return parseInt(heightStr) || null;
  }

  private updateProgress(step: string): void {
    this.progress.currentStep = step;
    this.progress.progress++;
    
    const elapsed = Date.now() - this.progress.startTime.getTime();
    const rate = this.progress.progress / elapsed;
    const remaining = (this.progress.totalSteps - this.progress.progress) / rate;
    this.progress.estimatedTimeRemaining = remaining;
    
    console.log(`Progress: ${this.progress.progress}/${this.progress.totalSteps} - ${step}`);
  }

  private calculateTotalSteps(seasons: string[], includePlayoffs: boolean): number {
    let steps = 1; // Teams
    steps += seasons.length; // Players per season
    steps += seasons.length * (includePlayoffs ? 2 : 1); // Games per season
    steps += seasons.length * 5; // All game stats tables per season
    steps += seasons.length * 2; // Season aggregations per season
    steps += seasons.length; // MoneyPuck per season
    return steps;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate comprehensive backfill report
   */
  private async generateBackfillReport(): Promise<void> {
    console.log('\n📊 BACKFILL COMPLETION REPORT');
    console.log('=' .repeat(50));
    
    const report = {
      tablesPopulated: Object.entries(this.progress.tablesPopulated)
        .filter(([_, populated]) => populated)
        .map(([table]) => table),
      recordCounts: {} as Record<string, number>
    };
    
    // Get record counts for each table
    for (const table of report.tablesPopulated) {
      try {
        const result = await this.executeQuery(`SELECT COUNT(*) FROM ${table}`);
        report.recordCounts[table] = parseInt(result.rows[0].count);
      } catch (error) {
        report.recordCounts[table] = 0;
      }
    }
    
    console.log('Tables populated:');
    Object.entries(report.recordCounts).forEach(([table, count]) => {
      console.log(`  ✅ ${table}: ${count.toLocaleString()} records`);
    });
    
    console.log(`\n⏱️  Total time: ${((Date.now() - this.progress.startTime.getTime()) / 1000 / 60).toFixed(1)} minutes`);
    console.log(`❌ Errors: ${this.progress.errors.length}`);
    
    if (this.progress.errors.length > 0) {
      console.log('\nErrors encountered:');
      this.progress.errors.forEach(error => console.log(`  - ${error}`));
    }
  }

  /**
   * Public interface methods
   */
  public getProgress(): CompleteBackfillProgress {
    return { ...this.progress };
  }

  public isBackfillRunning(): boolean {
    return this.isRunning;
  }

  public async stopBackfill(): Promise<void> {
    if (this.isRunning) {
      this.isRunning = false;
      this.progress.currentStep = 'Stopped by user';
    }
  }

  /**
   * Complete game data insertion with all fields
   */
  private async insertCompleteGameData(game: any, season: string): Promise<void> {
    const query = `
      INSERT INTO games (
        id, season, game_type, date_time, home_team_id, away_team_id,
        home_score, away_score, period, game_state, venue
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id)
      DO UPDATE SET
        season = EXCLUDED.season,
        game_type = EXCLUDED.game_type,
        date_time = EXCLUDED.date_time,
        home_team_id = EXCLUDED.home_team_id,
        away_team_id = EXCLUDED.away_team_id,
        home_score = EXCLUDED.home_score,
        away_score = EXCLUDED.away_score,
        period = EXCLUDED.period,
        game_state = EXCLUDED.game_state,
        venue = EXCLUDED.venue;
    `;
    
    const values = [
      game.id,
      season,
      game.gameType || '02',
      game.gameDate || game.startTimeUTC,
      game.homeTeam?.id,
      game.awayTeam?.id,
      game.homeTeam?.score || 0,
      game.awayTeam?.score || 0,
      game.period || 3,
      game.gameState || (game.gameScheduleState === 'OK' ? 'Final' : 'Scheduled'),
      game.venue?.default || 'Unknown'
    ];
    
    await this.executeQuery(query, values);
  }

  /**
   * Process complete player game statistics with all advanced metrics
   */
  private async processCompletePlayerGameStats(gameId: number, boxscore: any): Promise<void> {
    const teams = ['homeTeam', 'awayTeam'];
    
    for (const teamKey of teams) {
      const team = boxscore[teamKey];
      if (!team || !team.players) continue;
      
      for (const player of team.players) {
        if (!player.statistics) continue;
        
        const stats = player.statistics;
        
        // Handle different stat categories
        const skaterStats = stats.find((s: any) => s.category === 'skaterStats')?.stats;
        const powerPlayStats = stats.find((s: any) => s.category === 'powerPlay')?.stats;
        const penaltyKillStats = stats.find((s: any) => s.category === 'penaltyKill')?.stats;
        
        if (skaterStats) {
          await this.insertPlayerGameStats(gameId, player.playerId, team.id, {
            ...skaterStats,
            powerPlayStats,
            penaltyKillStats
          });
        }
      }
    }
  }

  /**
   * Insert detailed player game statistics
   */
  private async insertPlayerGameStats(gameId: number, playerId: number, teamId: number, stats: any): Promise<void> {
    const query = `
      INSERT INTO player_game_stats (
        game_id, player_id, team_id, goals, assists, points, plus_minus,
        penalty_minutes, shots, hits, blocks, time_on_ice_seconds,
        powerplay_time_seconds, shorthanded_time_seconds, corsi_for, corsi_against,
        expected_goals, expected_assists, individual_corsi_for, individual_fenwick_for
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (game_id, player_id) DO UPDATE SET
        team_id = EXCLUDED.team_id,
        goals = EXCLUDED.goals,
        assists = EXCLUDED.assists,
        points = EXCLUDED.points,
        plus_minus = EXCLUDED.plus_minus,
        penalty_minutes = EXCLUDED.penalty_minutes,
        shots = EXCLUDED.shots,
        hits = EXCLUDED.hits,
        blocks = EXCLUDED.blocks,
        time_on_ice_seconds = EXCLUDED.time_on_ice_seconds,
        powerplay_time_seconds = EXCLUDED.powerplay_time_seconds,
        shorthanded_time_seconds = EXCLUDED.shorthanded_time_seconds,
        corsi_for = EXCLUDED.corsi_for,
        corsi_against = EXCLUDED.corsi_against,
        expected_goals = EXCLUDED.expected_goals,
        expected_assists = EXCLUDED.expected_assists,
        individual_corsi_for = EXCLUDED.individual_corsi_for,
        individual_fenwick_for = EXCLUDED.individual_fenwick_for;
    `;
    
    const values = [
      gameId,
      playerId,
      teamId,
      stats.goals || 0,
      stats.assists || 0,
      (stats.goals || 0) + (stats.assists || 0),
      stats.plusMinus || 0,
      stats.penaltyMinutes || 0,
      stats.shots || 0,
      stats.hits || 0,
      stats.blockedShots || 0,
      this.parseTimeToSeconds(stats.timeOnIce),
      this.parseTimeToSeconds(stats.powerPlayStats?.timeOnIce) || 0,
      this.parseTimeToSeconds(stats.penaltyKillStats?.timeOnIce) || 0,
      stats.corsiFor || 0,
      stats.corsiAgainst || 0,
      stats.expectedGoals || 0,
      stats.expectedAssists || 0,
      stats.individualCorsiFor || 0,
      stats.individualFenwickFor || 0
    ];
    
    await this.executeQuery(query, values);
  }

  /**
   * Process goalie game statistics
   */
  private async processGoalieGameStats(gameId: number, boxscore: any): Promise<void> {
    const teams = ['homeTeam', 'awayTeam'];
    
    for (const teamKey of teams) {
      const team = boxscore[teamKey];
      if (!team || !team.goalies) continue;
      
      for (const goalie of team.goalies) {
        if (!goalie.statistics) continue;
        
        const goalieStats = goalie.statistics.find((s: any) => s.category === 'goalieStats')?.stats;
        if (goalieStats) {
          await this.insertGoalieGameStats(gameId, goalie.playerId, team.id, goalieStats);
        }
      }
    }
  }

  /**
   * Insert goalie game statistics
   */
  private async insertGoalieGameStats(gameId: number, playerId: number, teamId: number, stats: any): Promise<void> {
    const query = `
      INSERT INTO goalie_game_stats (
        game_id, player_id, team_id, shots_against, saves, goals_against,
        save_percentage, time_on_ice_seconds, decision, shutout,
        expected_goals_against, goals_saved_above_expected,
        high_danger_saves, high_danger_shots_against,
        medium_danger_saves, medium_danger_shots_against,
        low_danger_saves, low_danger_shots_against
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (game_id, player_id) DO UPDATE SET
        team_id = EXCLUDED.team_id,
        shots_against = EXCLUDED.shots_against,
        saves = EXCLUDED.saves,
        goals_against = EXCLUDED.goals_against,
        save_percentage = EXCLUDED.save_percentage,
        time_on_ice_seconds = EXCLUDED.time_on_ice_seconds,
        decision = EXCLUDED.decision,
        shutout = EXCLUDED.shutout,
        expected_goals_against = EXCLUDED.expected_goals_against,
        goals_saved_above_expected = EXCLUDED.goals_saved_above_expected,
        high_danger_saves = EXCLUDED.high_danger_saves,
        high_danger_shots_against = EXCLUDED.high_danger_shots_against,
        medium_danger_saves = EXCLUDED.medium_danger_saves,
        medium_danger_shots_against = EXCLUDED.medium_danger_shots_against,
        low_danger_saves = EXCLUDED.low_danger_saves,
        low_danger_shots_against = EXCLUDED.low_danger_shots_against;
    `;
    
    const shotsAgainst = stats.shotsAgainst || 0;
    const goalsAgainst = stats.goalsAgainst || 0;
    const saves = shotsAgainst - goalsAgainst;
    const savePercentage = shotsAgainst > 0 ? (saves / shotsAgainst) : 0;
    
    const values = [
      gameId,
      playerId,
      teamId,
      shotsAgainst,
      saves,
      goalsAgainst,
      savePercentage,
      this.parseTimeToSeconds(stats.timeOnIce),
      stats.decision || null,
      goalsAgainst === 0 && shotsAgainst > 0,
      stats.expectedGoalsAgainst || 0,
      stats.goalsSavedAboveExpected || 0,
      stats.highDangerSaves || 0,
      stats.highDangerShotsAgainst || 0,
      stats.mediumDangerSaves || 0,
      stats.mediumDangerShotsAgainst || 0,
      stats.lowDangerSaves || 0,
      stats.lowDangerShotsAgainst || 0
    ];
    
    await this.executeQuery(query, values);
  }

  /**
   * Process team game statistics
   */
  private async processTeamGameStats(gameId: number, boxscore: any): Promise<void> {
    const teams = [
      { key: 'homeTeam', isHome: true },
      { key: 'awayTeam', isHome: false }
    ];
    
    for (const { key, isHome } of teams) {
      const team = boxscore[key];
      if (!team || !team.teamStats) continue;
      
      await this.insertTeamGameStats(gameId, team.id, isHome, team.teamStats);
    }
  }

  /**
   * Insert team game statistics
   */
  private async insertTeamGameStats(gameId: number, teamId: number, isHome: boolean, stats: any): Promise<void> {
    const query = `
      INSERT INTO team_game_stats (
        game_id, team_id, is_home, goals, assists, shots, hits, blocks,
        penalty_minutes, powerplay_goals, powerplay_opportunities,
        faceoff_wins, faceoff_attempts, corsi_for, corsi_against,
        fenwick_for, fenwick_against, expected_goals_for, expected_goals_against,
        high_danger_shots_for, high_danger_shots_against
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (game_id, team_id) DO UPDATE SET
        is_home = EXCLUDED.is_home,
        goals = EXCLUDED.goals,
        assists = EXCLUDED.assists,
        shots = EXCLUDED.shots,
        hits = EXCLUDED.hits,
        blocks = EXCLUDED.blocks,
        penalty_minutes = EXCLUDED.penalty_minutes,
        powerplay_goals = EXCLUDED.powerplay_goals,
        powerplay_opportunities = EXCLUDED.powerplay_opportunities,
        faceoff_wins = EXCLUDED.faceoff_wins,
        faceoff_attempts = EXCLUDED.faceoff_attempts,
        corsi_for = EXCLUDED.corsi_for,
        corsi_against = EXCLUDED.corsi_against,
        fenwick_for = EXCLUDED.fenwick_for,
        fenwick_against = EXCLUDED.fenwick_against,
        expected_goals_for = EXCLUDED.expected_goals_for,
        expected_goals_against = EXCLUDED.expected_goals_against,
        high_danger_shots_for = EXCLUDED.high_danger_shots_for,
        high_danger_shots_against = EXCLUDED.high_danger_shots_against;
    `;
    
    const values = [
      gameId,
      teamId,
      isHome,
      stats.goals || 0,
      stats.assists || 0,
      stats.shots || 0,
      stats.hits || 0,
      stats.blockedShots || 0,
      stats.penaltyMinutes || 0,
      stats.powerPlayGoals || 0,
      stats.powerPlayOpportunities || 0,
      stats.faceoffWins || 0,
      stats.faceoffAttempts || 0,
      stats.corsiFor || 0,
      stats.corsiAgainst || 0,
      stats.fenwickFor || 0,
      stats.fenwickAgainst || 0,
      stats.expectedGoalsFor || 0,
      stats.expectedGoalsAgainst || 0,
      stats.highDangerShotsFor || 0,
      stats.highDangerShotsAgainst || 0
    ];
    
    await this.executeQuery(query, values);
  }

  /**
   * Process shot-by-shot data from play-by-play
   */
  private async processShotData(gameId: number, playByPlay: any): Promise<void> {
    if (!playByPlay.plays) return;
    
    for (const play of playByPlay.plays) {
      if (['shot-on-goal', 'goal', 'missed-shot', 'blocked-shot'].includes(play.typeDescKey)) {
        await this.insertShotData(gameId, play);
      }
    }
  }

  /**
   * Insert individual shot data
   */
  private async insertShotData(gameId: number, play: any): Promise<void> {
    const query = `
      INSERT INTO shots (
        game_id, shooter_id, goalie_id, team_id, period, time_remaining_seconds,
        x_coordinate, y_coordinate, shot_type, shot_distance, shot_angle,
        is_goal, is_rebound, is_penalty_shot, is_empty_net, expected_goal_value, shot_danger_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT DO NOTHING;
    `;
    
    const shotDetails = play.details || {};
    const coordinates = shotDetails.shotCoordinates || {};
    
    const values = [
      gameId,
      shotDetails.shootingPlayerId || null,
      shotDetails.goalieInNetId || null,
      play.details?.eventOwnerTeamId || null,
      play.periodDescriptor?.number || 1,
      this.parseGameTimeToSeconds(play.timeInPeriod, play.periodDescriptor?.number),
      coordinates.x || null,
      coordinates.y || null,
      shotDetails.shotType || 'unknown',
      this.calculateShotDistance(coordinates),
      this.calculateShotAngle(coordinates),
      play.typeDescKey === 'goal',
      shotDetails.isRebound || false,
      play.situationCode?.includes('penalty-shot') || false,
      shotDetails.isEmptyNet || false,
      shotDetails.expectedGoalValue || 0,
      this.calculateShotDanger(coordinates, shotDetails.shotType)
    ];
    
    await this.executeQuery(query, values);
  }

  /**
   * Update player advanced statistics from MoneyPuck
   */
  private async updatePlayerAdvancedStats(playerStats: any[], season: string): Promise<void> {
    for (const player of playerStats) {
      if (!player.playerId) continue;
      
      const updateQuery = `
        UPDATE player_season_stats SET
          corsi_for_percentage = $1,
          fenwick_for_percentage = $2,
          expected_goals = $3,
          expected_assists = $4,
          goals_above_replacement = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE player_id = $6 AND season = $7
      `;
      
      const values = [
        parseFloat(player.corsiForPct) || null,
        parseFloat(player.fenwickForPct) || null,
        parseFloat(player.xGoals) || null,
        parseFloat(player.xAssists) || null,
        parseFloat(player.goalsAboveReplacement) || null,
        parseInt(player.playerId),
        season
      ];
      
      await this.executeQuery(updateQuery, values);
    }
  }

  /**
   * Update team advanced statistics from MoneyPuck
   */
  private async updateTeamAdvancedStats(teamStats: any[], season: string): Promise<void> {
    for (const team of teamStats) {
      if (!team.team) continue;
      
      // Map team abbreviation to team ID
      const teamIdQuery = 'SELECT id FROM teams WHERE abbreviation = $1';
      const teamResult = await this.executeQuery(teamIdQuery, [team.team]);
      
      if (teamResult.rows.length === 0) continue;
      const teamId = teamResult.rows[0].id;
      
      const updateQuery = `
        UPDATE team_season_stats SET
          corsi_for_percentage = $1,
          fenwick_for_percentage = $2,
          expected_goals_for = $3,
          expected_goals_against = $4,
          pdo = $5,
          powerplay_percentage = $6,
          penalty_kill_percentage = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE team_id = $8 AND season = $9
      `;
      
      const values = [
        parseFloat(team.corsiForPct) || null,
        parseFloat(team.fenwickForPct) || null,
        parseFloat(team.xGoalsFor) || null,
        parseFloat(team.xGoalsAgainst) || null,
        parseFloat(team.pdo) || null,
        parseFloat(team.powerPlayPct) || null,
        parseFloat(team.penaltyKillPct) || null,
        teamId,
        season
      ];
      
      await this.executeQuery(updateQuery, values);
    }
  }

  /**
   * Utility methods for data parsing
   */
  private parseTimeToSeconds(timeString: string | null): number {
    if (!timeString) return 0;
    
    const parts = timeString.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  }

  private parseGameTimeToSeconds(timeInPeriod: string | null, period: number): number {
    if (!timeInPeriod) return 0;
    
    const [minutes, seconds] = timeInPeriod.split(':').map(Number);
    const totalSecondsInPeriod = 20 * 60; // 20 minutes per period
    const elapsedInPeriod = minutes * 60 + seconds;
    
    return totalSecondsInPeriod - elapsedInPeriod; // Time remaining in period
  }

  private calculateShotDistance(coordinates: any): number | null {
    if (!coordinates.x || !coordinates.y) return null;
    
    // Calculate distance from goal (assuming goal is at x=89, y=0 for home team)
    const goalX = 89;
    const goalY = 0;
    
    return Math.sqrt(Math.pow(coordinates.x - goalX, 2) + Math.pow(coordinates.y - goalY, 2));
  }

  private calculateShotAngle(coordinates: any): number | null {
    if (!coordinates.x || !coordinates.y) return null;
    
    // Calculate angle from goal line
    const goalX = 89;
    const goalY = 0;
    
    return Math.atan2(Math.abs(coordinates.y - goalY), Math.abs(coordinates.x - goalX)) * (180 / Math.PI);
  }

  private calculateShotDanger(coordinates: any, shotType: string): string {
    if (!coordinates.x || !coordinates.y) return 'unknown';
    
    const distance = this.calculateShotDistance(coordinates);
    if (!distance) return 'unknown';
    
    // Classify shot danger based on distance and location
    if (distance < 20 && Math.abs(coordinates.y) < 10) {
      return 'high';
    } else if (distance < 35) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}

// Export a factory function instead of a singleton instance
export const createCompleteDataBackfillService = (pool: Pool) => {
  return new CompleteDataBackfillService(pool);
};

// Export the class itself for direct instantiation
export { CompleteDataBackfillService };