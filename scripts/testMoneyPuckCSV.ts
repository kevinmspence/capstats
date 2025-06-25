#!/usr/bin/env tsx
// scripts/testMoneyPuckCSV.ts

import axios from 'axios';

async function testMoneyPuckCSV() {
  const baseUrl = 'https://moneypuck.com/moneypuck/playerData';
  
  // Test different years and CSV endpoints
  const testYears = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];
  const dataTypes = ['teams', 'skaters', 'goalies'];
  
  console.log('🔍 Testing MoneyPuck CSV file availability...\n');
  
  for (const year of testYears) {
    console.log(`Testing year ${year}:`);
    
    for (const dataType of dataTypes) {
      try {
        // Try different possible CSV URL patterns
        const csvUrls = [
          `${baseUrl}/${dataType}/${year}/regular.csv`,
          `${baseUrl}/${dataType}_${year}_regular.csv`,
          `${baseUrl}/${year}/${dataType}_regular.csv`,
          `https://moneypuck.com/data/${dataType}/${year}/regular.csv`,
          `https://moneypuck.com/csv/${dataType}/${year}.csv`
        ];
        
        let found = false;
        for (const url of csvUrls) {
          try {
            const response = await axios.head(url, { timeout: 5000 });
            if (response.status === 200) {
              console.log(`  ✅ ${dataType} CSV found: ${url}`);
              found = true;
              break;
            }
          } catch (error) {
            // Continue to next URL pattern
          }
        }
        
        if (!found) {
          console.log(`  ❌ ${dataType} CSV not found for ${year}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error testing ${dataType}: ${error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
    
    // Add a small delay to be nice to their server
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Also test the main page to see what's actually available
  console.log('📊 Checking MoneyPuck main page for available files...');
  try {
    const mainPageResponse = await axios.get('https://moneypuck.com/moneypuck/', { timeout: 10000 });
    console.log('✅ Main page accessible, check browser for actual file links');
  } catch (error) {
    console.log('❌ Could not access main page');
  }
}

testMoneyPuckCSV()
  .then(() => {
    console.log('🏁 CSV testing completed');
    console.log('\n💡 Recommendation: Visit https://moneypuck.com/moneypuck/ manually to see available CSV files');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 CSV testing failed:', error);
    process.exit(1);
  });