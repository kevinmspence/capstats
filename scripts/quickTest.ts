// scripts/quickTest.ts
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function quickTest() {
  console.log('🧪 Quick Database Test');
  console.log('=====================');
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Testing connection...');
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Simple team stats without ON CONFLICT
    console.log('📊 Adding basic team stats...');
    
    const stats = [
      { gameId: 2024020500, teamId: 15, isHome: true, goals: 4, shots: 32, hits: 18 },
      { gameId: 2024020500, teamId: 3, isHome: false, goals: 2, shots: 28, hits: 22 }
    ];

    for (const stat of stats) {
      // Check if exists first
      const existsResult = await client.query(
        'SELECT COUNT(*) FROM team_game_stats WHERE game_id = $1 AND team_id = $2',
        [stat.gameId, stat.teamId]
      );
      
      if (parseInt(existsResult.rows[0].count) === 0) {
        await client.query(
          'INSERT INTO team_game_stats (game_id, team_id, is_home, goals, shots, hits) VALUES ($1, $2, $3, $4, $5, $6)',
          [stat.gameId, stat.teamId, stat.isHome, stat.goals, stat.shots, stat.hits]
        );
        console.log(`✅ Added stats for game ${stat.gameId}, team ${stat.teamId}`);
      } else {
        console.log(`⚠️  Stats already exist for game ${stat.gameId}, team ${stat.teamId}`);
      }
    }

    // Final count
    console.log('\n📊 Final Results:');
    const queries = [
      { name: 'Teams', query: 'SELECT COUNT(*) FROM teams' },
      { name: 'Players', query: 'SELECT COUNT(*) FROM players' },
      { name: 'Games', query: 'SELECT COUNT(*) FROM games' },
      { name: 'Team Game Stats', query: 'SELECT COUNT(*) FROM team_game_stats' }
    ];

    for (const { name, query } of queries) {
      const result = await client.query(query);
      console.log(`${name}: ${result.rows[0].count} records`);
    }

    // Show some sample data
    console.log('\n🎯 Sample Capitals data:');
    const capsPlayersResult = await client.query(`
      SELECT p.first_name, p.last_name, p.position, p.jersey_number
      FROM players p 
      JOIN teams t ON p.team_id = t.id 
      WHERE t.abbreviation = 'WSH'
      ORDER BY p.jersey_number
      LIMIT 5
    `);
    
    if (capsPlayersResult.rows.length > 0) {
      console.log('📋 Capitals Players:');
      capsPlayersResult.rows.forEach(player => {
        console.log(`  #${player.jersey_number} ${player.first_name} ${player.last_name} (${player.position})`);
      });
    }

    const gamesResult = await client.query(`
      SELECT g.id, ht.abbreviation as home, at.abbreviation as away, g.home_score, g.away_score
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      WHERE ht.abbreviation = 'WSH' OR at.abbreviation = 'WSH'
      LIMIT 3
    `);
    
    if (gamesResult.rows.length > 0) {
      console.log('\n🏒 Recent Capitals Games:');
      gamesResult.rows.forEach(game => {
        console.log(`  ${game.away} @ ${game.home}: ${game.away_score}-${game.home_score}`);
      });
    }

    client.release();
    console.log('\n🎉 SUCCESS! Your database now has sample data for testing your dashboard!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
    console.log('🔌 Connection closed');
  }
}

quickTest().catch(console.error);