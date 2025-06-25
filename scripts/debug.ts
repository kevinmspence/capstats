#!/usr/bin/env tsx
// scripts/debug.ts

console.log('🔍 Debug script starting...');
console.log('Node version:', process.version);
console.log('Arguments:', process.argv);

try {
  console.log('✅ Basic script execution works');
  
  // Test if we can import from src
  console.log('🔧 Attempting to import historicalDataService...');
  
  const { historicalDataService } = require('../src/services/historicalDataService');
  console.log('✅ Import successful');
  console.log('Service methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(historicalDataService)));
  
} catch (error) {
  console.error('❌ Import failed:', error.message);
  console.error('Full error:', error);
}

console.log('🏁 Debug script completed');