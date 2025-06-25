// scripts/simpleTestBackfill.ts
import { Pool } from 'pg';
import { createCompleteDataBackfillService } from '../src/services/completeDataBackfillService';
import * as dotenv from 'dotenv';

dotenv.config();

async function runSimpleTest() {
  console.log('🧪 Simple Test Backfill');
  console.log('========================');
  
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
    client.release();

    console.log('🔧 Creating backfill service...');
    const service = createCompleteDataBackfillService(pool);
    console.log('✅ Service created');

    console.log('🚀 Starting test backfill...');
    await service.startTestBackfill(['20232024']);
    console.log('✅ Test backfill completed!');

    // Quick validation
    const teamsResult = await pool.query('SELECT COUNT(*) FROM teams');
    const playersResult = await pool.query('SELECT COUNT(*) FROM players');
    const gamesResult = await pool.query('SELECT COUNT(*) FROM games');

    console.log('\n📊 Results:');
    console.log(`Teams: ${teamsResult.rows[0].count}`);
    console.log(`Players: ${playersResult.rows[0].count}`);
    console.log(`Games: ${gamesResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
    console.log('🔌 Connection closed');
  }
}

runSimpleTest().catch(console.error);