# Usage Examples

## Method 1: Interactive CLI (Easiest) 🎯

The interactive CLI provides a menu-driven interface:

```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src
node benchmark-cli.js
```

Or using npm:

```bash
npm start
```

You'll see:
```
╔════════════════════════════════════════════════════════════════╗
║        🍔 FOOD SEARCH API BENCHMARK TOOL 🍔                    ║
╚════════════════════════════════════════════════════════════════╝

What would you like to do?

  1. Run benchmark on PRODUCTION
  2. Run benchmark on STAGING
  3. Compare two result files
  4. View results in browser
  5. List existing result files
  6. Edit test queries
  7. Exit
```

---

## Method 2: Direct Command Line

### Run Production Benchmark

```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src
node food-search-benchmark.js production food-search-input.json
```

### Run Staging Benchmark

```bash
node food-search-benchmark.js staging food-search-input.json
```

### Using Shell Script

```bash
./run-benchmark.sh production
# or
./run-benchmark.sh staging
```

### Using NPM Scripts

```bash
npm run test:prod   # Test production
npm run test:stg    # Test staging
```

---

## Method 3: Programmatic Usage

You can import and use the functions in your own scripts:

```javascript
const { makeRequest, runBenchmark, calculateStats } = require('./food-search-benchmark');

async function myTest() {
  // Test single query
  const result = await makeRequest('production', 'Apple');
  console.log('Response time:', result.response_time_ms, 'ms');
  
  // Test multiple queries
  const queries = ['Apple', 'Banana', 'Orange'];
  const results = await runBenchmark('production', queries);
  
  // Calculate statistics
  const stats = calculateStats(results);
  console.log('Average response time:', stats.avg_response_time_ms, 'ms');
}

myTest();
```

---

## Comparing Results

### Interactive

```bash
node benchmark-cli.js
# Select option 3
```

### Command Line

```bash
node compare-results.js test-results/prod-result-25-10-2025-103045.json test-results/stg-result-25-10-2025-103120.json
```

Example output:

```
╔════════════════════════════════════════════════════════════════╗
║           FOOD SEARCH API BENCHMARK COMPARISON                 ║
╚════════════════════════════════════════════════════════════════╝

📊 COMPARING:
   File 1: prod-result-25-10-2025-103045.json
   Environment: PRODUCTION
   Date: 10/25/2025, 10:30:45 AM

   File 2: stg-result-25-10-2025-103120.json
   Environment: STAGING
   Date: 10/25/2025, 10:31:20 AM

────────────────────────────────────────────────────────────────

📈 STATISTICS COMPARISON:

   Avg Response Time:
      File 1: 245.67ms
      File 2: 198.34ms  ↓ -47.33ms (-19.3%) ✓

📌 SUMMARY:

   ✅ File 2 is FASTER by 47.33ms (19.3%)
```

---

## Viewing Results

### Start Web Server

```bash
cd /Users/an.vtran/Downloads/datasets/Calorie
python3 -m http.server 8000
```

Then open: **http://localhost:8000/src/benchmark-viewer.html**

### Or Use npm

```bash
npm run serve
```

---

## Customizing Test Data

### Edit the Input File

```bash
nano src/food-search-input.json
```

Or using the CLI:

```bash
node benchmark-cli.js
# Select option 6
```

### Example Input

```json
{
  "description": "My custom test queries",
  "food_queries": [
    "Steak",
    "Pasta",
    "Sushi",
    "Tacos",
    "Burger"
  ]
}
```

---

## Advanced Examples

### 1. Run Multiple Tests in Sequence

```bash
#!/bin/bash

echo "Running comprehensive test suite..."

# Test production
echo "Testing production..."
node src/food-search-benchmark.js production src/food-search-input.json

# Wait a bit
sleep 5

# Test staging
echo "Testing staging..."
node src/food-search-benchmark.js staging src/food-search-input.json

# Compare results
echo "Comparing results..."
PROD_FILE=$(ls -t test-results/prod-result-*.json | head -1)
STG_FILE=$(ls -t test-results/stg-result-*.json | head -1)
node src/compare-results.js $PROD_FILE $STG_FILE

echo "All tests completed!"
```

### 2. Automated Daily Testing

Create a cron job:

```bash
# Run every day at 3 AM
0 3 * * * cd /Users/an.vtran/Downloads/datasets/Calorie && node src/food-search-benchmark.js production src/food-search-input.json
```

### 3. Test with Different Query Sets

```bash
# Test with exact matches only
node src/food-search-benchmark.js production src/exact-queries.json

# Test with partial matches only
node src/food-search-benchmark.js production src/partial-queries.json

# Test with invalid queries
node src/food-search-benchmark.js production src/invalid-queries.json
```

### 4. Custom Headers for Different API Keys

Modify `food-search-benchmark.js`:

```javascript
const HEADERS = {
  'x-vulcan-application-id': process.env.VULCAN_APP_ID || '6698870692',
  'x-device-id': process.env.DEVICE_ID || '3A65FAB2-699A-410F-8777-472151C7BD2F',
  // ... other headers
};
```

Then run with environment variables:

```bash
VULCAN_APP_ID=your_app_id DEVICE_ID=your_device_id node src/food-search-benchmark.js production src/food-search-input.json
```

---

## Troubleshooting Examples

### Check if API is accessible

```bash
curl -I https://api.vulcanlabs.co/calories/api/v2/public/food-database
```

### Test single query manually

```javascript
const https = require('https');

const options = {
  hostname: 'api.vulcanlabs.co',
  path: '/calories/api/v2/public/food-database?description=Apple&limit=10&offset=0',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Test'
  }
};

https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', (d) => process.stdout.write(d));
}).end();
```

### Debug mode

Add verbose logging:

```bash
NODE_DEBUG=http node src/food-search-benchmark.js production src/food-search-input.json
```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: API Performance Test

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Run benchmark
        run: |
          cd Calorie/src
          node food-search-benchmark.js production food-search-input.json
      
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: benchmark-results
          path: Calorie/test-results/*.json
```

---

## Performance Monitoring

### Track Performance Over Time

```bash
#!/bin/bash

# Extract avg response times from all results
for file in test-results/prod-result-*.json; do
  avg=$(jq '.statistics.avg_response_time_ms' "$file")
  date=$(jq -r '.metadata.test_date' "$file")
  echo "$date,$avg"
done > performance-history.csv
```

### Alert on Slow Performance

```bash
#!/bin/bash

THRESHOLD=500  # Alert if avg > 500ms

node src/food-search-benchmark.js production src/food-search-input.json

LATEST=$(ls -t test-results/prod-result-*.json | head -1)
AVG=$(jq '.statistics.avg_response_time_ms' "$LATEST")

if (( $(echo "$AVG > $THRESHOLD" | bc -l) )); then
  echo "⚠️  ALERT: Average response time ($AVG ms) exceeds threshold ($THRESHOLD ms)"
  # Send notification (email, Slack, etc.)
fi
```

---

## Best Practices

1. **Run tests during off-peak hours** to get consistent baseline metrics
2. **Run multiple iterations** and average the results for more accuracy
3. **Document any changes** to API configuration or test queries
4. **Compare results** before and after API changes
5. **Keep historical data** for trend analysis
6. **Test different scenarios**: exact matches, partial matches, edge cases
7. **Monitor both response time and accuracy** (total_search_results)

---

## Quick Reference

| Task | Command |
|------|---------|
| Interactive CLI | `node benchmark-cli.js` |
| Test Production | `node food-search-benchmark.js production food-search-input.json` |
| Test Staging | `node food-search-benchmark.js staging food-search-input.json` |
| Compare Results | `node compare-results.js file1.json file2.json` |
| View in Browser | `python3 -m http.server 8000` |
| Edit Queries | `nano food-search-input.json` |
| List Results | `ls -lh ../test-results/` |

