// src/services/databaseService.ts
import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class DatabaseService {
  private pool: Pool;
  private readonly CAPITALS_TEAM_ID = 15;

  constructor() {
    const dbConfig = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
      } : false,
      max: Number(process.env.DB_MAX_CONNECTIONS) || 10,
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT) || 5000,
    };

    console.log('🔧 Database configuration:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   SSL: ${!!dbConfig.ssl}`);

    this.pool = new Pool(dbConfig);
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  async upsertTeamSeasonStats(teamData: any, season: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Convert season format from "2008-2009" to "20082009" to fit VARCHAR(8)
      const seasonForDB = season.replace('-', '');
      
      const query = `
        INSERT INTO team_season_stats (
          team_id, season, games_played, wins, losses, overtime_losses,
          goals_for, goals_against, goal_differential,
          corsi_for_percentage, fenwick_for_percentage,
          expected_goals_for, expected_goals_against,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
        )
        ON CONFLICT (team_id, season) DO UPDATE SET
          games_played = EXCLUDED.games_played,
          wins = EXCLUDED.wins,
          losses = EXCLUDED.losses,
          overtime_losses = EXCLUDED.overtime_losses,
          goals_for = EXCLUDED.goals_for,
          goals_against = EXCLUDED.goals_against,
          goal_differential = EXCLUDED.goal_differential,
          corsi_for_percentage = EXCLUDED.corsi_for_percentage,
          fenwick_for_percentage = EXCLUDED.fenwick_for_percentage,
          expected_goals_for = EXCLUDED.expected_goals_for,
          expected_goals_against = EXCLUDED.expected_goals_against,
          updated_at = NOW()
      `;

      const values = [
        this.CAPITALS_TEAM_ID,
        seasonForDB, // Use the converted season format
        teamData.games_played || teamData.GP || 82,
        teamData.wins || teamData.W || 0,
        teamData.losses || teamData.L || 0,
        teamData.overtime_losses || teamData.OTL || 0,
        teamData.goalsFor || teamData.GF || 0,
        teamData.goalsAgainst || teamData.GA || 0,
        (teamData.goalsFor || 0) - (teamData.goalsAgainst || 0),
        teamData.corsiForPct || teamData.corsiPercentage || null,
        teamData.fenwickForPct || teamData.fenwickPercentage || null,
        teamData.xGoalsFor || teamData.expected_goals_for || null,
        teamData.xGoalsAgainst || teamData.expected_goals_against || null
      ];

      await client.query(query, values);
      console.log(`✅ Upserted team season stats for ${season} (DB: ${seasonForDB})`);
    } catch (error) {
      console.error(`❌ Failed to upsert team stats for ${season}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async upsertPlayerSeasonStats(playerData: any[], season: string): Promise<void> {
    if (!playerData || playerData.length === 0) {
      console.log(`⚠️ No player data for ${season}`);
      return;
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const player of playerData) {
        try {
          await this.ensurePlayerExists(client, player);
          const playerId = await this.getPlayerIdByName(client, player.name || `${player.firstName} ${player.lastName}`);
          
          if (playerId) {
            await this.upsertPlayerStats(client, playerId, player, season);
          }
        } catch (playerError: any) {
          console.error(`❌ Error processing player ${player.name || 'Unknown'}:`, playerError?.message || 'Unknown error');
          // Continue with other players instead of failing the entire batch
        }
      }

      await client.query('COMMIT');
      console.log(`✅ Upserted ${playerData.length} player season stats for ${season}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Failed to upsert player stats for ${season}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async ensurePlayerExists(client: PoolClient, player: any): Promise<void> {
    const name = player.name || `${player.firstName || ''} ${player.lastName || ''}`.trim();
    if (!name) return;

    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      // First check if player exists
      const checkQuery = `
        SELECT id FROM players 
        WHERE team_id = $1 AND first_name = $2 AND last_name = $3
        LIMIT 1
      `;
      
      const existing = await client.query(checkQuery, [this.CAPITALS_TEAM_ID, firstName, lastName]);
      
      if (existing.rows.length === 0) {
        // Player doesn't exist, insert them
        // Use manual ID generation to avoid sequence issues
        const maxIdQuery = `SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM players`;
        const maxIdResult = await client.query(maxIdQuery);
        const nextId = maxIdResult.rows[0].next_id;
        
        const insertQuery = `
          INSERT INTO players (
            id, team_id, first_name, last_name, position, jersey_number
          ) VALUES (
            $1, $2, $3, $4, $5, $6
          )
        `;

        const values = [
          nextId,
          this.CAPITALS_TEAM_ID,
          firstName,
          lastName,
          player.position || 'F',
          player.jersey_number || player.jerseyNumber || null
        ];

        await client.query(insertQuery, values);
        console.log(`   ➕ Added player: ${firstName} ${lastName} (ID: ${nextId})`);
      } else {
        // Player exists, optionally update their info
        const playerId = existing.rows[0].id;
        const updateQuery = `
          UPDATE players 
          SET position = $3, jersey_number = $4
          WHERE id = $1 AND team_id = $2
        `;
        
        const values = [
          playerId,
          this.CAPITALS_TEAM_ID,
          player.position || 'F',
          player.jersey_number || player.jerseyNumber || null
        ];

        await client.query(updateQuery, values);
      }
    } catch (error: any) {
      console.error(`❌ Error ensuring player exists for ${name}:`, error?.message || 'Unknown error');
      throw error;
    }
  }

  private async getPlayerIdByName(client: PoolClient, playerName: string): Promise<number | null> {
    if (!playerName) return null;

    const nameParts = playerName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const query = `
      SELECT id FROM players 
      WHERE team_id = $1 AND first_name = $2 AND last_name = $3
      LIMIT 1
    `;

    const result = await client.query(query, [this.CAPITALS_TEAM_ID, firstName, lastName]);
    return result.rows[0]?.id || null;
  }

  private async upsertPlayerStats(client: PoolClient, playerId: number, player: any, season: string): Promise<void> {
    const seasonForDB = season.replace('-', '');
    
    // Log the player data to see what columns we actually have
    console.log(`   🔍 Player data sample for ${player.name || 'Unknown'}:`, {
      goals: player.goals,
      assists: player.assists,
      points: player.points,
      games: player.games,
      icetime: player.icetime,
      shots: player.shots
    });
    
    // First check if stats exist
    const checkQuery = `
      SELECT id FROM player_season_stats 
      WHERE player_id = $1 AND season = $2 AND team_id = $3
      LIMIT 1
    `;
    
    const existing = await client.query(checkQuery, [playerId, seasonForDB, this.CAPITALS_TEAM_ID]);
    
    if (existing.rows.length === 0) {
      // Insert new stats - use MoneyPuck column names
      const insertQuery = `
        INSERT INTO player_season_stats (
          player_id, season, team_id, games_played, goals, assists, points,
          plus_minus, penalty_minutes, shots, shooting_percentage,
          time_on_ice_total_seconds, corsi_for_percentage, fenwick_for_percentage,
          expected_goals, expected_assists, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
        )
      `;

      const values = [
        playerId,
        seasonForDB,
        this.CAPITALS_TEAM_ID,
        // Try different possible column names from MoneyPuck
        player.games || player.gamesPlayed || player.GP || 0,
        player.goals || player.G || 0,
        player.assists || player.A || 0,
        player.points || player.PTS || (player.goals || 0) + (player.assists || 0),
        player.plusMinus || player.plus_minus || player['+/-'] || 0,
        player.penaltyMinutes || player.penalty_minutes || player.PIM || 0,
        player.shots || player.S || player.SOG || 0,
        player.shootingPct || player.shooting_percentage || player['S%'] || null,
        // Convert icetime (likely in minutes) to seconds
        player.icetime ? Math.round(player.icetime * 60) : (player.time_on_ice_total_seconds || 0),
        player.corsiForPct || player.corsi_for_percentage || player['CF%'] || null,
        player.fenwickForPct || player.fenwick_for_percentage || player['FF%'] || null,
        player.xGoals || player.expected_goals || player.xG || null,
        player.xAssists || player.expected_assists || player.xA || null
      ];

      await client.query(insertQuery, values);
    } else {
      // Update existing stats
      const updateQuery = `
        UPDATE player_season_stats SET
          games_played = $4,
          goals = $5,
          assists = $6,
          points = $7,
          plus_minus = $8,
          penalty_minutes = $9,
          shots = $10,
          shooting_percentage = $11,
          time_on_ice_total_seconds = $12,
          corsi_for_percentage = $13,
          fenwick_for_percentage = $14,
          expected_goals = $15,
          expected_assists = $16,
          updated_at = NOW()
        WHERE player_id = $1 AND season = $2 AND team_id = $3
      `;

      const values = [
        playerId,
        seasonForDB,
        this.CAPITALS_TEAM_ID,
        player.games || player.gamesPlayed || player.GP || 0,
        player.goals || player.G || 0,
        player.assists || player.A || 0,
        player.points || player.PTS || (player.goals || 0) + (player.assists || 0),
        player.plusMinus || player.plus_minus || player['+/-'] || 0,
        player.penaltyMinutes || player.penalty_minutes || player.PIM || 0,
        player.shots || player.S || player.SOG || 0,
        player.shootingPct || player.shooting_percentage || player['S%'] || null,
        player.icetime ? Math.round(player.icetime * 60) : (player.time_on_ice_total_seconds || 0),
        player.corsiForPct || player.corsi_for_percentage || player['CF%'] || null,
        player.fenwickForPct || player.fenwick_for_percentage || player['FF%'] || null,
        player.xGoals || player.expected_goals || player.xG || null,
        player.xAssists || player.expected_assists || player.xA || null
      ];

      await client.query(updateQuery, values);
    }
  }

  async writeHistoricalSeasonData(seasonData: any): Promise<void> {
    try {
      console.log(`📊 Writing ${seasonData.season} data to database...`);

      if (seasonData.team) {
        await this.upsertTeamSeasonStats(seasonData.team, seasonData.season);
      }

      if (seasonData.players && seasonData.players.length > 0) {
        await this.upsertPlayerSeasonStats(seasonData.players, seasonData.season);
      }

      console.log(`✅ Successfully wrote ${seasonData.season} data to database`);
    } catch (error) {
      console.error(`❌ Failed to write ${seasonData.season} data to database:`, error);
      throw error;
    }
  }

  async getAvailableSeasons(): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT season 
        FROM team_season_stats 
        WHERE team_id = $1 
        ORDER BY season
      `;
      
      const result = await this.pool.query(query, [this.CAPITALS_TEAM_ID]);
      return result.rows.map(row => row.season);
    } catch (error) {
      console.error('❌ Failed to get available seasons:', error);
      return [];
    }
  }

  async seasonExists(season: string): Promise<boolean> {
    try {
      // Convert season format for database lookup
      const seasonForDB = season.replace('-', '');
      
      const query = `
        SELECT 1 FROM team_season_stats 
        WHERE team_id = $1 AND season = $2 
        LIMIT 1
      `;
      
      const result = await this.pool.query(query, [this.CAPITALS_TEAM_ID, seasonForDB]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`❌ Failed to check if season ${season} exists:`, error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    console.log('📪 Database connection pool closed');
  }
}

export const databaseService = new DatabaseService();