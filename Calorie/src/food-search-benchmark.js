/**
 * Food Search API Performance Benchmark
 * Measures response times for food search queries across different environments
 * 
 * Cache-Busting Strategy (ensures each request behaves like "first-time"):
 * 1. Connection-level: 'Connection: close' forces new TCP connection each time
 * 2. HTTP-level: Cache-Control, Pragma, and Expires headers prevent HTTP caching
 * 3. URL-level: Unique cache-busting query parameter (_cb) for each request
 * 4. Agent-level: agent: false creates new HTTP agent per request
 * 5. Timing: Configurable delay between requests allows caches to settle
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  staging: {
    host: 'stg-api.vulcanlabs.co', // Update with actual staging host
    protocol: 'https'
  },
  production: {
    host: 'api.vulcanlabs.co',
    protocol: 'https'
  },
  // Delay between requests in milliseconds
  // Helps prevent rate limiting and ensures fresh requests
  delayBetweenRequests: 1000 // 1 second delay
};

// Headers from the provided curl command
const HEADERS = {
  'Host': '', // Will be set dynamically
  'Connection': 'close', // Force new connection each time (disable keep-alive)
  'x-vulcan-application-id': '6698870692',
  'x-device-id': '3A65FAB2-699A-410F-8777-472151C7BD2F',
  'Accept': 'application/json',
  'User-Agent': 'iOS App, Version 1.0.20',
  'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
  'Content-Type': 'application/json',
  // Cache-busting headers
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

/**
 * Makes a single API request and measures response time
 */
function makeRequest(environment, searchDescription, limit = 30, offset = 60) {
  return new Promise((resolve, reject) => {
    const config = CONFIG[environment];
    const encodedDescription = encodeURIComponent(searchDescription);
    const path = `/calories/api/v2/public/food-database?description=${encodedDescription}&limit=${limit}&offset=${offset}`;
    
    const headers = { ...HEADERS };
    headers['Host'] = config.host;
    
    const options = {
      hostname: config.host,
      port: config.protocol === 'https' ? 443 : 80,
      path: path,
      method: 'GET',
      headers: headers,
      // Create new agent for each request (prevents connection reuse)
      agent: false
    };
    
    const startTime = performance.now(); // More precise timing
    const protocol = config.protocol === 'https' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime); // Round to ms
        
        let totalResults = 0;
        let responseBody = null;
        
        try {
          responseBody = JSON.parse(data);
          // console.log(responseBody);
          totalResults = responseBody?.Data?.length || 0;
          console.log(totalResults);
        } catch (e) {
          console.error(`Error parsing response for "${searchDescription}":`, e.message);
        }
        
        resolve({
          search_description: searchDescription,
          response_time_ms: responseTime,
          status_code: res.statusCode,
          total_search_results: totalResults,
          success: res.statusCode >= 200 && res.statusCode < 300,
          timestamp: new Date().toISOString(),
          environment: environment
        });
      });
    });
    
    req.on('error', (error) => {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      resolve({
        search_description: searchDescription,
        response_time_ms: responseTime,
        status_code: 0,
        total_search_results: 0,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        environment: environment
      });
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Runs benchmark for a list of food search queries
 */
async function runBenchmark(environment, foodQueries) {
  console.log(`\n=== Running benchmark on ${environment.toUpperCase()} environment ===\n`);
  
  const results = [];
  
  for (let i = 0; i < foodQueries.length; i++) {
    const query = foodQueries[i];
    console.log(`[${i + 1}/${foodQueries.length}] Testing: "${query}"`);
    
    try {
      const result = await makeRequest(environment, query);
      results.push(result);
      
      console.log(`  ✓ Response time: ${result.response_time_ms}ms | Status: ${result.status_code} | Results: ${result.total_search_results}`);
      
      // Add delay between requests to:
      // 1. Avoid rate limiting
      // 2. Allow server caches to settle
      // 3. Ensure each request is treated as fresh/independent
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
      results.push({
        search_description: query,
        response_time_ms: 0,
        status_code: 0,
        total_search_results: 0,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        environment: environment
      });
    }
  }
  
  return results;
}

/**
 * Calculates statistics from benchmark results
 */
function calculateStats(results) {
  const successfulResults = results.filter(r => r.success);
  const responseTimes = successfulResults.map(r => r.response_time_ms);
  
  if (responseTimes.length === 0) {
    return {
      total_requests: results.length,
      successful_requests: 0,
      failed_requests: results.length,
      avg_response_time_ms: 0,
      min_response_time_ms: 0,
      max_response_time_ms: 0,
      median_response_time_ms: 0
    };
  }
  
  responseTimes.sort((a, b) => a - b);
  const sum = responseTimes.reduce((a, b) => a + b, 0);
  const avg = sum / responseTimes.length;
  const median = responseTimes[Math.floor(responseTimes.length / 2)];
  
  return {
    total_requests: results.length,
    successful_requests: successfulResults.length,
    failed_requests: results.length - successfulResults.length,
    avg_response_time_ms: Math.round(avg * 100) / 100,
    min_response_time_ms: Math.min(...responseTimes),
    max_response_time_ms: Math.max(...responseTimes),
    median_response_time_ms: median
  };
}

/**
 * Saves results to JSON file
 */
function saveResults(environment, results, stats) {
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
  const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
  
  const filename = `${environment}-result-${dateStr}-${timeStr}.json`;
  
  // Determine subfolder based on environment
  const subfolder = environment === 'production' ? 'baseline' : 'current';
  const outputDir = path.join(__dirname, '..', 'api-results', subfolder);
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const output = {
    metadata: {
      environment: environment,
      test_date: now.toISOString(),
      total_queries: results.length
    },
    statistics: stats,
    results: results
  };
  
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
  
  console.log(`\n✓ Results saved to: ${filepath}`);
  return filepath;
}

/**
 * Prints summary statistics
 */
function printSummary(environment, stats) {
  console.log(`\n=== ${environment.toUpperCase()} Summary ===`);
  console.log(`Total Requests: ${stats.total_requests}`);
  console.log(`Successful: ${stats.successful_requests}`);
  console.log(`Failed: ${stats.failed_requests}`);
  console.log(`Avg Response Time: ${stats.avg_response_time_ms}ms`);
  console.log(`Min Response Time: ${stats.min_response_time_ms}ms`);
  console.log(`Max Response Time: ${stats.max_response_time_ms}ms`);
  console.log(`Median Response Time: ${stats.median_response_time_ms}ms`);
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'production'; // Default to production
  const inputFile = args[1] || path.join(__dirname, 'food-search-input.json');
  
  // Validate environment
  if (!CONFIG[environment]) {
    console.error(`Error: Invalid environment "${environment}". Use "staging" or "production"`);
    process.exit(1);
  }
  
  // Load input data
  let inputData;
  try {
    const inputContent = fs.readFileSync(inputFile, 'utf8');
    inputData = JSON.parse(inputContent);
  } catch (error) {
    console.error(`Error loading input file: ${error.message}`);
    process.exit(1);
  }
  
  const foodQueries = inputData.food_queries || inputData;
  
  if (!Array.isArray(foodQueries) || foodQueries.length === 0) {
    console.error('Error: Input file must contain an array of food queries');
    process.exit(1);
  }
  
  console.log(`Loaded ${foodQueries.length} food queries from ${inputFile}`);
  
  // Run benchmark
  const results = await runBenchmark(environment, foodQueries);
  
  // Calculate statistics
  const stats = calculateStats(results);
  
  // Print summary
  printSummary(environment, stats);
  
  // Save results
  const outputFile = saveResults(environment, results, stats);
  
  console.log('\n✓ Benchmark completed successfully!\n');
  
  return {
    results,
    stats,
    outputFile
  };
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { makeRequest, runBenchmark, calculateStats };

