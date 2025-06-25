#!/usr/bin/env tsx
// scripts/testActualMoneyPuck.ts

import axios from 'axios';

async function testActualMoneyPuckCSV() {
  console.log('🔍 Testing actual MoneyPuck CSV file patterns...\n');
  
  // Based on the moneypuck.com/data.htm page structure
  // Let's test a few recent years to find the correct URL pattern
  const testYears = ['2023', '2022', '2021'];
  
  for (const year of testYears) {
    console.log(`Testing year ${year}-${parseInt(year) + 1}:`);
    
    // Try different possible URL patterns based on the data.htm page
    const urlPatterns = [
      // Pattern 1: Direct season format
      {
        skaters: `https://moneypuck.com/moneypuck/playerData/seasons/regular/${year}-${parseInt(year) + 1}/skaters.csv`,
        goalies: `https://moneypuck.com/moneypuck/playerData/seasons/regular/${year}-${parseInt(year) + 1}/goalies.csv`,
        teams: `https://moneypuck.com/moneypuck/playerData/seasons/regular/${year}-${parseInt(year) + 1}/teams.csv`
      },
      // Pattern 2: Year only format
      {
        skaters: `https://moneypuck.com/moneypuck/playerData/skaters/${year}/regular.csv`,
        goalies: `https://moneypuck.com/moneypuck/playerData/goalies/${year}/regular.csv`, 
        teams: `https://moneypuck.com/moneypuck/playerData/teams/${year}/regular.csv`
      },
      // Pattern 3: Different base URL
      {
        skaters: `https://moneypuck.com/data/skaters_${year}_regular.csv`,
        goalies: `https://moneypuck.com/data/goalies_${year}_regular.csv`,
        teams: `https://moneypuck.com/data/teams_${year}_regular.csv`
      }
    ];
    
    for (let i = 0; i < urlPatterns.length; i++) {
      console.log(`  Testing URL pattern ${i + 1}:`);
      const pattern = urlPatterns[i];
      
      for (const [dataType, url] of Object.entries(pattern)) {
        try {
          console.log(`    Checking ${dataType}: ${url}`);
          const response = await axios.head(url, { 
            timeout: 10000,
            validateStatus: (status) => status < 500 // Accept redirects
          });
          
          if (response.status === 200) {
            console.log(`    ✅ ${dataType} CSV found! Status: ${response.status}`);
            
            // Try to get a small sample of the actual data
            try {
              const dataResponse = await axios.get(url, { 
                timeout: 15000,
                responseType: 'text',
                headers: { 'Range': 'bytes=0-1000' } // Get first 1KB
              });
              console.log(`    📊 Sample data (first 200 chars): ${dataResponse.data.substring(0, 200)}...`);
            } catch (sampleError) {
              console.log(`    ⚠️ Could not fetch sample data`);
            }
          } else {
            console.log(`    ❌ ${dataType} not found (status: ${response.status})`);
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
            console.log(`    ❌ ${dataType} not found (404)`);
          } else {
            console.log(`    ❌ ${dataType} error: ${error.message}`);
          }
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log(''); // Empty line between patterns
    }
    
    console.log(''); // Empty line between years
  }
  
  // Also test the exact URLs we can see from the webpage source
  console.log('🌐 Testing by examining the actual webpage links...');
  try {
    const webpageResponse = await axios.get('https://moneypuck.com/data.htm', { timeout: 10000 });
    const html = webpageResponse.data;
    
    // Look for CSV download links in the HTML
    const csvLinkRegex = /href="([^"]*\.csv[^"]*)"/gi;
    const matches: string[] | null = html.match(csvLinkRegex);
    
    if (matches && matches.length > 0) {
      console.log('✅ Found CSV links in webpage:');
      const uniqueLinks = [...new Set(matches)].slice(0, 10); // Show first 10 unique links
      for (const match of uniqueLinks) {
        const url: string = match.replace(/href="|"/g, '');
        console.log(`  📎 ${url}`);
      }
    } else {
      console.log('❌ No CSV links found in webpage HTML');
    }
    
  } catch (error) {
    console.log('❌ Could not fetch webpage to examine links');
  }
}

testActualMoneyPuckCSV()
  .then(() => {
    console.log('🏁 Actual MoneyPuck CSV testing completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Testing failed:', error);
    process.exit(1);
  });