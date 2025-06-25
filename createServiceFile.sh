#!/bin/bash
# createServiceFile.sh

echo "📁 Creating services directory..."
mkdir -p src/services

echo "📝 Creating completeDataBackfillService.ts..."
cat > src/services/completeDataBackfillService.ts << 'EOF'
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
   * Test backfill - loads minimal data for testing
   */
  async startTestBackfill(seasons: string[] = ['20232024']): Promise<void> {
    console.log('🔍 startTestBackfill method called with seasons:', seasons);
    
    if (this.isRunning) {
      throw new Error('Backfill already in progress');
    }

    this.isRunning = true;
    this.progress.totalSteps = 4;
    this.progress.startTime = new Date();

    try {
      console.log('🧪 Starting Test Backfill');
      
      // Step 1: Teams
      console.log('📍 Step 1: Starting teams backfill...');
      await this.insertFallbackTeams();
      console.log('✅ Step 1: Teams completed');
      
      // Step 2: Capitals players
      console.log('📍 Step 2: Starting Capitals players...');
      await this.insertFallbackCapitalsPlayers();
      console.log('✅ Step 2: Capitals players completed');
      
      // Step 3: Sample games
      console.log('📍 Step 3: Starting sample games...');
      await this.insertSampleCapitalsGames(seasons[0]);
      console.log('✅ Step 3: Sample games completed');
      
      // Step 4: Basic stats
      console.log('📍 Step 4: Starting basic team stats...');
      await this.insertSampleTeamStats();
      console.log('✅ Step 4: Basic stats completed');
      
      console.log('✅ Test backfill finished successfully!');
      await this.generateTestBackfillReport();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Test backfill error:', errorMessage);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Insert all NHL teams (fallback data)
   */
  private async insertFallbackTeams(): Promise<void> {
    const teams = [
      { id: 1, name: 'New Jersey Devils', abbrev: 'NJD', city: 'New Jersey', division: 'Metropolitan', conference: 'Eastern' },
      { id: 2, name: 'New York Islanders', abbrev: 'NYI', city: 'New York', division: 'Metropolitan', conference: 'Eastern' },
      { id: 3, name: 'New York Rangers', abbrev: 'NYR', city: 'New York', division: 'Metropolitan', conference: 'Eastern' },
      { id: 4, name: 'Philadelphia Flyers', abbrev: 'PHI', city: 'Philadelphia', division: 'Metropolitan', conference: 'Eastern' },
      { id: 5, name: 'Pittsburgh Penguins', abbrev: 'PIT', city: 'Pittsburgh', division: 'Metropolitan', conference: 'Eastern' },
      { id: 6, name: 'Boston Bruins', abbrev: 'BOS', city: 'Boston', division: 'Atlantic', conference: 'Eastern' },
      { id: 7, name: 'Buffalo Sabres', abbrev: 'BUF', city: 'Buffalo', division: 'Atlantic', conference: 'Eastern' },
      { id: 8, name: 'Montreal Canadiens', abbrev: 'MTL', city: 'Montreal', division: 'Atlantic', conference: 'Eastern' },
      { id: 9, name: 'Ottawa Senators', abbrev: 'OTT', city: 'Ottawa', division: 'Atlantic', conference: 'Eastern' },
      { id: 10, name: 'Toronto Maple Leafs', abbrev: 'TOR', city: 'Toronto', division: 'Atlantic', conference: 'Eastern' },
      { id: 12, name: 'Carolina Hurricanes', abbrev: 'CAR', city: 'Carolina', division: 'Metropolitan', conference: 'Eastern' },
      { id: 13, name: 'Florida Panthers', abbrev: 'FLA', city: 'Florida', division: 'Atlantic', conference: 'Eastern' },
      { id: 14, name: 'Tampa Bay Lightning', abbrev: 'TBL', city: 'Tampa Bay', division: 'Atlantic', conference: 'Eastern' },
      { id: 15, name: 'Washington Capitals', abbrev: 'WSH', city: 'Washington', division: 'Metropolitan', conference: 'Eastern' },
      { id: 16, name: 'Chicago Blackhawks', abbrev: 'CHI', city: 'Chicago', division: 'Central', conference: 'Western' },
      { id: 17, name: 'Detroit Red Wings', abbrev: 'DET', city: 'Detroit', division: 'Atlantic', conference: 'Eastern' },
      { id: 18, name: 'Nashville Predators', abbrev: 'NSH', city: 'Nashville', division: 'Central', conference: 'Western' },
      { id: 19, name: 'St. Louis Blues', abbrev: 'STL', city: 'St. Louis', division: 'Central', conference: 'Western' },
      { id: 20, name: 'Calgary Flames', abbrev: 'CGY', city: 'Calgary', division: 'Pacific', conference: 'Western' },
      { id: 21, name: 'Colorado Avalanche', abbrev: 'COL', city: 'Colorado', division: 'Central', conference: 'Western' },
      { id: 22, name: 'Edmonton Oilers', abbrev: 'EDM', city: 'Edmonton', division: 'Pacific', conference: 'Western' },
      { id: 23, name: 'Vancouver Canucks', abbrev: 'VAN', city: 'Vancouver', division: 'Pacific', conference: 'Western' },
      { id: 24, name: 'Anaheim Ducks', abbrev: 'ANA', city: 'Anaheim', division: 'Pacific', conference: 'Western' },
      { id: 25, name: 'Dallas Stars', abbrev: 'DAL', city: 'Dallas', division: 'Central', conference: 'Western' },
      { id: 26, name: 'Los Angeles Kings', abbrev: 'LAK', city: 'Los Angeles', division: 'Pacific', conference: 'Western' },
      { id: 27, name: 'San Jose Sharks', abbrev: 'SJS', city: 'San Jose', division: 'Pacific', conference: 'Western' },
      { id: 28, name: 'Columbus Blue Jackets', abbrev: 'CBJ', city: 'Columbus', division: 'Metropolitan', conference: 'Eastern' },
      { id: 29, name: 'Minnesota Wild', abbrev: 'MIN', city: 'Minnesota', division: 'Central', conference: 'Western' },
      { id: 30, name: 'Winnipeg Jets', abbrev: 'WPG', city: 'Winnipeg', division: 'Central', conference: 'Western' },
      { id: 53, name: 'Arizona Coyotes', abbrev: 'ARI', city: 'Arizona', division: 'Central', conference: 'Western' },
      { id: 54, name: 'Vegas Golden Knights', abbrev: 'VGK', city: 'Las Vegas', division: 'Pacific', conference: 'Western' },
      { id: 55, name: 'Seattle Kraken', abbrev: 'SEA', city: 'Seattle', division: 'Pacific', conference: 'Western' }
    ];

    const query = 'INSERT INTO teams (id, name, abbreviation, city, division, conference) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, abbreviation = EXCLUDED.abbreviation, city = EXCLUDED.city, division = EXCLUDED.division, conference = EXCLUDED.conference';

    for (const team of teams) {
      await this.executeQuery(query, [team.id, team.name, team.abbrev, team.city, team.division, team.conference]);
    }
    
    console.log(`✅ Inserted ${teams.length} teams`);
  }

  /**
   * Insert Capitals players (fallback data)
   */
  private async insertFallbackCapitalsPlayers(): Promise<void> {
    const players = [
      { id: 8471214, firstName: 'Alexander', lastName: 'Ovechkin', position: 'LW', number: 8 },
      { id: 8470638, firstName: 'Nicklas', lastName: 'Backstrom', position: 'C', number: 19 },
      { id: 8476453, firstName: 'John', lastName: 'Carlson', position: 'D', number: 74 },
      { id: 8476872, firstName: 'T.J.', lastName: 'Oshie', position: 'RW', number: 77 },
      { id: 8477493, firstName: 'Evgeny', lastName: 'Kuznetsov', position: 'C', number: 92 },
      { id: 8477998, firstName: 'Tom', lastName: 'Wilson', position: 'RW', number: 43 },
      { id: 8478402, firstName: 'Charlie', lastName: 'Lindgren', position: 'G', number: 79 },
      { id: 8480817, firstName: 'Dylan', lastName: 'Strome', position: 'C', number: 17 },
      { id: 8481522, firstName: 'Anthony', lastName: 'Mantha', position: 'RW', number: 39 },
      { id: 8482073, firstName: 'Connor', lastName: 'McMichael', position: 'C', number: 24 }
    ];

    const query = 'INSERT INTO players (id, team_id, first_name, last_name, position, jersey_number) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET team_id = EXCLUDED.team_id, position = EXCLUDED.position, jersey_number = EXCLUDED.jersey_number';

    for (const player of players) {
      await this.executeQuery(query, [player.id, this.CAPITALS_TEAM_ID, player.firstName, player.lastName, player.position, player.number]);
    }
    
    console.log(`✅ Inserted ${players.length} Capitals players`);
  }

  /**
   * Insert sample games
   */
  private async insertSampleCapitalsGames(season: string): Promise<void> {
    const games = [
      { id: 2024020500, homeTeamId: 15, awayTeamId: 3, homeScore: 4, awayScore: 2, gameDate: '2024-12-20', venue: 'Capital One Arena' },
      { id: 2024020501, homeTeamId: 6, awayTeamId: 15, homeScore: 3, awayScore: 1, gameDate: '2024-12-18', venue: 'TD Garden' },
      { id: 2024020502, homeTeamId: 15, awayTeamId: 5, homeScore: 2, awayScore: 3, gameDate: '2024-12-15', venue: 'Capital One Arena' },
      { id: 2024020503, homeTeamId: 13, awayTeamId: 15, homeScore: 1, awayScore: 4, gameDate: '2024-12-12', venue: 'FLA Live Arena' },
      { id: 2024020504, homeTeamId: 15, awayTeamId: 14, homeScore: 5, awayScore: 2, gameDate: '2024-12-10', venue: 'Capital One Arena' }
    ];

    const query = 'INSERT INTO games (id, season, game_type, date_time, home_team_id, away_team_id, home_score, away_score, game_state, venue) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING';

    for (const game of games) {
      await this.executeQuery(query, [game.id, season, '02', game.gameDate, game.homeTeamId, game.awayTeamId, game.homeScore, game.awayScore, 'Final', game.venue]);
    }
    
    console.log(`✅ Inserted ${games.length} sample games`);
  }

  /**
   * Insert basic team game stats
   */
  private async insertSampleTeamStats(): Promise<void> {
    const stats = [
      { gameId: 2024020500, teamId: 15, isHome: true, goals: 4, shots: 32, hits: 18 },
      { gameId: 2024020500, teamId: 3, isHome: false, goals: 2, shots: 28, hits: 22 },
      { gameId: 2024020501, teamId: 6, isHome: true, goals: 3, shots: 35, hits: 20 },
      { gameId: 2024020501, teamId: 15, isHome: false, goals: 1, shots: 24, hits: 16 }
    ];

    const query = 'INSERT INTO team_game_stats (game_id, team_id, is_home, goals, shots, hits) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (game_id, team_id) DO UPDATE SET goals = EXCLUDED.goals, shots = EXCLUDED.shots, hits = EXCLUDED.hits';

    for (const stat of stats) {
      await this.executeQuery(query, [stat.gameId, stat.teamId, stat.isHome, stat.goals, stat.shots, stat.hits]);
    }
    
    console.log(`✅ Inserted ${stats.length} team game stats`);
  }

  /**
   * Generate test report
   */
  private async generateTestBackfillReport(): Promise<void> {
    console.log('\n📊 TEST BACKFILL REPORT');
    console.log('========================');
    
    const tables = ['teams', 'players', 'games', 'team_game_stats'];
    
    for (const table of tables) {
      const result = await this.executeQuery(`SELECT COUNT(*) FROM ${table}`);
      const count = parseInt(result.rows[0].count);
      console.log(`✅ ${table}: ${count} records`);
    }
    
    console.log('\n💡 Next steps:');
    console.log('  - Run "npm run db:status" to see detailed data');
    console.log('  - Your dashboard can now display basic team/player data!');
  }

  /**
   * Database query execution
   */
  private async executeQuery(query: string, values: any[] = []): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(query, values);
      return result;
    } finally {
      client.release();
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
}

// Export factory function
export const createCompleteDataBackfillService = (pool: Pool) => {
  return new CompleteDataBackfillService(pool);
};

export { CompleteDataBackfillService };
EOF

echo "✅ Service file created successfully!"
echo "📁 File location: src/services/completeDataBackfillService.ts"
echo ""
echo "🚀 Now you can run: npm run test-simple"