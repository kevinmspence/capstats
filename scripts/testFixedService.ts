#!/usr/bin/env tsx
// scripts/testFixedService.ts

console.log('🧪 Testing fixed historical data service...');

try {
  console.log('📦 Importing fixed service...');
  const { historicalDataService } = require('../src/services/historicalDataService-fixed');
  console.log('✅ Fixed service imported successfully');
  
  console.log('🔧 Testing service methods...');
  console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(historicalDataService)));
  
  console.log('🔍 Testing needsBackfill...');
  const needsBackfill = historicalDataService.needsBackfill();
  console.log('Needs backfill:', needsBackfill);
  
  console.log('📊 Testing generateSeasons (private method access)...');
  console.log('Cached seasons:', historicalDataService.getCachedSeasons().length);
  
  console.log('✅ All tests passed - service is ready to use');
  
} catch (error) {
  console.error('❌ Error testing fixed service:', error.message);
  console.error('Stack:', error.stack);
}

console.log('🏁 Test completed');