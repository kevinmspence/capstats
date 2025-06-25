// scripts/testConnection.ts
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

console.log('🔍 Loading environment variables...');
dotenv.config();

console.log('🔍 Environment check:');
console.log('DB_HOST:', process.env.DB_HOST ? '✅ Set' : '❌ Missing');
console.log('DB_PORT:', process.env.DB_PORT ? '✅ Set' : '❌ Missing');
console.log('DB_NAME:', process.env.DB_NAME ? '✅ Set' : '❌ Missing');
console.log('DB_USER:', process.env.DB_USER ? '✅ Set' : '❌ Missing');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ Set' : '❌ Missing');

async function testConnection() {
  console.log('\n🔗 Testing database connection...');
  
  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  };
  
  console.log('📋 Connection config:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Database: ${config.database}`);
  console.log(`  User: ${config.user}`);
  console.log(`  SSL: Enabled`);
  
  const pool = new Pool(config);
  
  try {
    console.log('\n⏳ Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    console.log('\n🧪 Testing basic query...');
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Query successful!');
    console.log('⏰ Server time:', result.rows[0].current_time);
    console.log('🐘 PostgreSQL version:', result.rows[0].db_version.split(' ')[0]);
    
    console.log('\n📊 Testing teams table...');
    try {
      const teamsResult = await client.query('SELECT COUNT(*) FROM teams');
      console.log('✅ Teams table exists:', teamsResult.rows[0].count, 'records');
    } catch (error) {
      console.log('⚠️  Teams table issue:', error);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND')) {
        console.error('💡 DNS resolution failed - check your DB_HOST');
      } else if (error.message.includes('authentication failed')) {
        console.error('💡 Authentication failed - check your DB_USER and DB_PASSWORD');
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.error('💡 Database not found - check your DB_NAME');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('💡 Connection refused - check your DB_HOST and DB_PORT');
      }
    }
  } finally {
    await pool.end();
  }
}

testConnection().catch(console.error);