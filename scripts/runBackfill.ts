#!/usr/bin/env tsx
// scripts/runCompleteBackfillWithDB.ts

console.log('🚀 Starting complete historical data backfill with database storage...');
console.log('Node version:', process.version);
console.log('Arguments:', process.argv);

async function runCompleteBackfillWithDB() {
  try {
    console.log('📦 Importing services...');
    const { historicalDataService } = require('../src/services/historicalDataService-fixed');
    const { databaseService } = require('../src/services/databaseService');
    console.log('✅ Services imported successfully');

    // Test database connection first
    console.log('🔗 Testing database connection...');
    const dbConnected = await databaseService.testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database. Please check your database configuration.');
    }

    // Check what seasons are already in the database
    console.log('📋 Checking existing data in database...');
    const existingSeasons = await databaseService.getAvailableSeasons();
    console.log(`Found ${existingSeasons.length} seasons already in database:`, existingSeasons);

    console.log('🚀 Starting backfill process...');
    
    // Check if backfill is needed
    const needsBackfill = historicalDataService.needsBackfill();
    console.log('Needs backfill:', needsBackfill);

    let seasonsWritten = 0;
    let seasonsSkipped = 0;

    const result = await historicalDataService.backfillHistoricalData(
      // Progress callback
      (progress) => {
        console.log(`📊 Progress: ${progress.progress.toFixed(1)}% - ${progress.currentSeason} (${progress.completedSeasons}/${progress.totalSeasons}) - ETA: ${progress.estimatedTimeRemaining}`);
      },
      // Season complete callback
      async (seasonData) => {
        if (!seasonData || !seasonData.season) {
          console.log('⚠️ No season data provided to callback');
          return;
        }

        try {
          // Check if this season already exists in database
          const seasonExists = await databaseService.seasonExists(seasonData.season);
          
          if (seasonExists && !process.argv.includes('--force')) {
            console.log(`⏭️ Skipping ${seasonData.season} - already in database (use --force to override)`);
            seasonsSkipped++;
            return;
          }

          // Write to database
          console.log(`💾 Writing ${seasonData.season} to database...`);
          await databaseService.writeHistoricalSeasonData(seasonData);
          seasonsWritten++;
          
          console.log(`✅ Successfully stored ${seasonData.season} in database`);
          
          // Log summary of what was written
          if (seasonData.dataAvailable) {
            const summary: string[] = [];
            if (seasonData.dataAvailable.team) summary.push('team stats');
            if (seasonData.dataAvailable.players) summary.push(`${seasonData.players?.length || 0} players`);
            if (seasonData.dataAvailable.goalies) summary.push(`${seasonData.goalies?.length || 0} goalies`);
            console.log(`   📈 Stored: ${summary.join(', ')}`);
          }
          
        } catch (dbError) {
          console.error(`❌ Failed to write ${seasonData.season} to database:`, dbError);
          // Continue with other seasons even if one fails
        }
      }
    );

    console.log('🎉 Historical backfill completed successfully!');
    console.log(`📊 Summary: ${seasonsWritten} seasons written, ${seasonsSkipped} seasons skipped`);
    
    // Show final database status
    const finalSeasons = await databaseService.getAvailableSeasons();
    console.log(`📚 Database now contains ${finalSeasons.length} seasons:`, finalSeasons.join(', '));
    
    // Optional: Export the data for verification
    console.log('📦 Memory cache summary:');
    const exportedData = historicalDataService.exportHistoricalData();
    console.log(`   ${exportedData.length} seasons in memory cache`);
    
    // Close database connection
    await databaseService.close();
    
  } catch (error: any) {
    console.error('❌ Backfill failed with error:');
    console.error('Error message:', error?.message || 'Unknown error');
    console.error('Error stack:', error?.stack);
    
    // Try to close database connection even on error
    try {
      const { databaseService } = require('../src/services/databaseService');
      await databaseService.close();
    } catch (closeError) {
      console.error('Failed to close database connection:', closeError);
    }
    
    throw error;
  }
}

// Check for flags
const isAuto = process.argv.includes('--auto');
const isForce = process.argv.includes('--force');

console.log('Auto mode:', isAuto);
console.log('Force mode (overwrite existing):', isForce);

if (isAuto) {
  console.log('🤖 Running in auto mode...');
}

if (isForce) {
  console.log('💪 Force mode enabled - will overwrite existing data');
}

// Run the backfill with comprehensive error handling
runCompleteBackfillWithDB()
  .then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed with error:');
    console.error(error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});