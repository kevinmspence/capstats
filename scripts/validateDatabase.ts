// scripts/validateDatabase.ts
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function validateDatabaseSchema() {
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

  console.log('🔍 Validating database schema...');
  console.log(`📡 Connecting to: ${process.env.DB_HOST}/${process.env.DB_NAME}`);

  const requiredTables = [
    'teams', 'players', 'games', 'player_game_stats', 
    'player_season_stats', 'team_game_stats', 'team_season_stats',
    'goalie_game_stats', 'shots'
  ];

  try {
    // Test basic connection
    const testResult = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Database connection successful');
    console.log(`⏰ Server time: ${testResult.rows[0].current_time}`);
    console.log(`🐘 PostgreSQL version: ${testResult.rows[0].db_version.split(' ')[0]}`);
    console.log('');

    // Check each required table
    console.log('📋 Checking required tables:');
    for (const table of requiredTables) {
      const query = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `;
      
      const result = await pool.query(query, [table]);
      
      if (result.rows.length === 0) {
        console.log(`❌ Table '${table}' not found`);
      } else {
        console.log(`✅ Table '${table}' exists with ${result.rows.length} columns`);
      }
    }

    // Check for important indexes
    console.log('\n🔍 Checking for performance indexes:');
    const indexQuery = `
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename IN (${requiredTables.map(() => '?').join(',').replace(/\?/g, '$1,$2,$3,$4,$5,$6,$7,$8,$9').split(',').map((_, i) => `$${i + 1}`).join(',')})
      AND indexname NOT LIKE '%_pkey'
    `;
    
    // Simplified index check
    const indexResult = await pool.query(`
      SELECT COUNT(*) as index_count
      FROM pg_indexes 
      WHERE tablename = ANY($1)
      AND indexname NOT LIKE '%_pkey'
    `, [requiredTables]);

    const indexCount = parseInt(indexResult.rows[0].index_count);
    if (indexCount > 0) {
      console.log(`✅ Found ${indexCount} custom indexes`);
    } else {
      console.log(`⚠️  No custom indexes found - consider adding after backfill`);
    }

    // Check database size
    const sizeQuery = `
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as db_size,
        current_database() as db_name
    `;
    const sizeResult = await pool.query(sizeQuery);
    console.log(`💾 Database size: ${sizeResult.rows[0].db_size}`);

    console.log('\n🎉 Schema validation completed!');
    
    // Check if tables have data
    console.log('\n📊 Quick data check:');
    for (const table of requiredTables.slice(0, 3)) { // Just check first 3 tables
      try {
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(countResult.rows[0].count);
        if (count > 0) {
          console.log(`  ${table}: ${count.toLocaleString()} records`);
        } else {
          console.log(`  ${table}: empty (ready for backfill)`);
        }
      } catch (error) {
        console.log(`  ${table}: table exists but may need data`);
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Schema validation failed:', errorMessage);
    
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
      console.error('💡 Connection issue - check your .env file and network connection');
    } else if (errorMessage.includes('authentication failed')) {
      console.error('💡 Authentication issue - check your username/password in .env');
    } else if (errorMessage.includes('database') && errorMessage.includes('does not exist')) {
      console.error('💡 Database not found - check your database name in .env');
    }
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  validateDatabaseSchema().catch(console.error);
}

export { validateDatabaseSchema };


