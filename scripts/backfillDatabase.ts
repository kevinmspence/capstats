#!/usr/bin/env tsx
// scripts/backfillDatabase.ts

console.log('🚀 Starting MoneyPuck historical data backfill to database...');

async function runBackfill() {
  try {
    console.log('📦 Importing services...');
    const { historicalDataService } = require('../src/services/historicalDataService');
    const { databaseService } = require('../src/services/databaseService');
    console.log('✅ Services imported successfully');

    console.log('🔗 Testing database connection...');
    const dbConnected = await databaseService.testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database. Check your .env file.');
    }

    console.log('📋 Checking existing data in database...');
    const existingSeasons = await databaseService.getAvailableSeasons();
    console.log(`Found ${existingSeasons.length} seasons already in database`);

    console.log('🚀 Starting MoneyPuck CSV backfill...');
    
    let seasonsWritten = 0;
    let seasonsSkipped = 0;

    await historicalDataService.backfillHistoricalData(
      // Progress callback
      (progress) => {
        console.log(`📊 Progress: ${progress.progress.toFixed(1)}% - ${progress.currentSeason} (${progress.completedSeasons}/${progress.totalSeasons})`);
      },
      // Season complete callback
      async (seasonData) => {
        if (!seasonData?.season) return;

        try {
          const seasonExists = await databaseService.seasonExists(seasonData.season);
          
          if (seasonExists && !process.argv.includes('--force')) {
            console.log(`⏭️ Skipping ${seasonData.season} - already exists`);
            seasonsSkipped++;
            return;
          }

          console.log(`💾 Writing ${seasonData.season} to database...`);
          await databaseService.writeHistoricalSeasonData(seasonData);
          seasonsWritten++;
          
          const summary: string[] = [];
          if (seasonData.team) summary.push('team stats');
          if (seasonData.players?.length > 0) summary.push(`${seasonData.players.length} players`);
          if (seasonData.goalies?.length > 0) summary.push(`${seasonData.goalies.length} goalies`);
          
          console.log(`✅ ${seasonData.season}: ${summary.join(', ')}`);
          
        } catch (dbError) {
          console.error(`❌ Failed to write ${seasonData.season}:`, dbError);
        }
      }
    );

    console.log('🎉 Backfill completed!');
    console.log(`📊 Summary: ${seasonsWritten} seasons written, ${seasonsSkipped} seasons skipped`);
    
    const finalSeasons = await databaseService.getAvailableSeasons();
    console.log(`📚 Database contains ${finalSeasons.length} seasons`);
    
    await databaseService.close();
    
  } catch (error: any) {
    console.error('❌ Backfill failed:', error?.message || error);
    process.exit(1);
  }
}

runBackfill()
  .then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });