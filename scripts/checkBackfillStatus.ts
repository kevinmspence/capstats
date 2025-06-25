// scripts/checkBackfillStatus.ts
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkBackfillStatus() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });

  console.log('📊 Checking backfill status...\n');

  try {
    // Check record counts
    const tables = [
      'teams', 'players', 'games', 'player_game_stats',
      'player_season_stats', 'team_game_stats', 'team_season_stats',
      'goalie_game_stats', 'shots'
    ];

    console.log('📈 Record counts:');
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        console.log(`  ${table.padEnd(20)} ${count.toLocaleString().padStart(10)} records`);
      } catch (error) {
        console.log(`  ${table.padEnd(20)} ${'ERROR'.padStart(10)}`);
      }
    }

    // Check data recency
    console.log('\n📅 Data recency:');
    const recencyQueries = [
      { name: 'Latest game', query: 'SELECT MAX(date_time) FROM games' },
      { name: 'Latest player stats', query: 'SELECT MAX(updated_at) FROM player_season_stats WHERE updated_at IS NOT NULL' },
      { name: 'Latest team stats', query: 'SELECT MAX(updated_at) FROM team_season_stats WHERE updated_at IS NOT NULL' },
    ];

    for (const { name, query } of recencyQueries) {
      try {
        const result = await pool.query(query);
        const date = result.rows[0].max;
        if (date) {
          console.log(`  ${name.padEnd(20)} ${new Date(date).toLocaleDateString()}`);
        } else {
          console.log(`  ${name.padEnd(20)} No data`);
        }
      } catch (error) {
        console.log(`  ${name.padEnd(20)} Error checking`);
      }
    }

    // Check Capitals-specific data
    console.log('\n🔴 Capitals-specific data:');
    const capsQueries = [
      { 
        name: 'Capitals players', 
        query: `SELECT COUNT(*) FROM players p JOIN teams t ON p.team_id = t.id WHERE t.abbreviation = 'WSH'` 
      },
      { 
        name: 'Capitals games', 
        query: `SELECT COUNT(*) FROM games g JOIN teams t ON (g.home_team_id = t.id OR g.away_team_id = t.id) WHERE t.abbreviation = 'WSH'` 
      },
      { 
        name: 'Ovechkin total goals', 
        query: `SELECT COALESCE(SUM(pss.goals), 0) as total FROM player_season_stats pss JOIN players p ON pss.player_id = p.id WHERE p.last_name ILIKE '%ovechkin%'` 
      },
    ];

    for (const { name, query } of capsQueries) {
      try {
        const result = await pool.query(query);
        const value = result.rows[0].count || result.rows[0].total || 0;
        console.log(`  ${name.padEnd(20)} ${parseInt(value).toLocaleString()}`);
      } catch (error) {
        console.log(`  ${name.padEnd(20)} Error`);
      }
    }

    // Determine backfill status
    const teamsResult = await pool.query('SELECT COUNT(*) FROM teams');
    const gamesResult = await pool.query('SELECT COUNT(*) FROM games');
    const playersResult = await pool.query('SELECT COUNT(*) FROM players');

    const teamsCount = parseInt(teamsResult.rows[0].count);
    const gamesCount = parseInt(gamesResult.rows[0].count);
    const playersCount = parseInt(playersResult.rows[0].count);

    console.log('\n🎯 Backfill Status:');
    if (teamsCount >= 30 && gamesCount >= 1000 && playersCount >= 500) {
      console.log('  ✅ Backfill appears complete');
      console.log('  💡 Your dashboard should have real data available');
    } else if (teamsCount >= 30) {
      console.log('  🔄 Partial backfill detected');
      console.log('  💡 Run "npm run backfill" to complete the data load');
    } else {
      console.log('  ⭕ No backfill data detected');
      console.log('  💡 Run "npm run backfill" to populate your database');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Status check failed:', errorMessage);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkBackfillStatus().catch(console.error);
}

export { checkBackfillStatus };