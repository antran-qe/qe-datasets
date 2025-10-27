# Food Search API Benchmark

A comprehensive tool for measuring and comparing API response times for food search queries across different environments (staging/production).

## Features

- 📊 Measures response time for each food search query
- 🎯 Tests with exact names, partial matches, and invalid queries
- 📈 Generates detailed statistics (avg, min, max, median)
- 💾 Saves results in structured JSON format
- 🎨 Beautiful web-based visualization dashboard
- 🔄 Support for staging and production environments

## Setup

### Prerequisites

- Node.js (v12 or higher)
- Internet connection to access the API

### Installation

No additional dependencies required! This tool uses only Node.js built-in modules.

## Usage

### 1. Running the Benchmark

#### Using Node.js directly:

```bash
# Test production environment (default)
node src/food-search-benchmark.js production src/food-search-input.json

# Test staging environment
node src/food-search-benchmark.js staging src/food-search-input.json
```

#### Using the shell script:

```bash
# Make script executable (first time only)
chmod +x src/run-benchmark.sh

# Run production test
./src/run-benchmark.sh production

# Run staging test
./src/run-benchmark.sh staging
```

### 2. Input Data Format

Edit `src/food-search-input.json` to customize your test queries:

```json
{
  "description": "Test data description",
  "food_queries": [
    "Cheese, Cream, Ice Cream & Yogurts",
    "Apple",
    "Chicken Breast",
    "Pizza",
    "xyzInvalidFood123"
  ]
}
```

### 3. Viewing Results

#### Option A: Open the viewer directly

1. Start a local web server:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Python 2
   python -m SimpleHTTPServer 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server -p 8000
   ```

2. Open browser: `http://localhost:8000/src/benchmark-viewer.html`

#### Option B: Use the existing validation server

```bash
python validate_and_serve.py
```

Then open: `http://localhost:8000/src/benchmark-viewer.html`

### 4. Output Files

Results are saved in `test-results/` directory with the following naming convention:

- **Staging**: `stg-result-DD-MM-YYYY-HHMMSS.json`
- **Production**: `prod-result-DD-MM-YYYY-HHMMSS.json`

#### Output Structure:

```json
{
  "metadata": {
    "environment": "production",
    "test_date": "2025-10-25T10:30:00.000Z",
    "total_queries": 10
  },
  "statistics": {
    "total_requests": 10,
    "successful_requests": 8,
    "failed_requests": 2,
    "avg_response_time_ms": 245.67,
    "min_response_time_ms": 180,
    "max_response_time_ms": 450,
    "median_response_time_ms": 230
  },
  "results": [
    {
      "search_description": "Apple",
      "response_time_ms": 230,
      "status_code": 200,
      "total_search_results": 45,
      "success": true,
      "timestamp": "2025-10-25T10:30:01.234Z",
      "environment": "production"
    }
  ]
}
```

## Environment Configuration

Update the `CONFIG` object in `food-search-benchmark.js` to configure different environments:

```javascript
const CONFIG = {
  staging: {
    host: 'api.staging.vulcanlabs.co',
    protocol: 'https'
  },
  production: {
    host: 'api.vulcanlabs.co',
    protocol: 'https'
  }
};
```

## Test Data Strategy

The included test data covers three categories:

1. **Exact Food Names** (6 items)
   - Examples: "Apple", "Chicken Breast", "Pizza"
   - Tests: Exact matching capability

2. **Partial Food Names** (2 items)
   - Examples: "Choco" (for chocolate), "Bana" (for banana)
   - Tests: Fuzzy/partial matching capability

3. **Invalid Names** (2 items)
   - Examples: "xyzInvalidFood123", "!@#$%^&*()"
   - Tests: Error handling and edge cases

## Interpreting Results

### Response Time Classification:
- **Fast**: < 500ms (Green)
- **Medium**: 500-1000ms (Orange)
- **Slow**: > 1000ms (Red)

### Success Criteria:
- Status code: 200-299
- Valid JSON response
- No network errors

## Troubleshooting

### Common Issues:

1. **"Error loading input file"**
   - Ensure `food-search-input.json` exists
   - Check JSON syntax is valid

2. **"Request timeout"**
   - Check internet connection
   - Verify API endpoint is accessible
   - Check if you're behind a proxy

3. **"Error parsing response"**
   - API may have returned non-JSON response
   - Check status code in results

4. **Rate Limiting**
   - Script includes 500ms delay between requests
   - Adjust delay in code if needed

## Comparing Results

To compare staging vs production:

1. Run benchmark on both environments
2. Open viewer and switch between result files
3. Compare statistics:
   - Average response times
   - Success rates
   - Result counts

## Advanced Usage

### Custom Headers

Modify the `HEADERS` object in `food-search-benchmark.js`:

```javascript
const HEADERS = {
  'x-vulcan-application-id': 'YOUR_APP_ID',
  'x-device-id': 'YOUR_DEVICE_ID',
  // ... other headers
};
```

### Adding More Test Cases

Simply add more queries to `food-search-input.json`:

```json
{
  "food_queries": [
    "Query 1",
    "Query 2",
    "..."
  ]
}
```

### Programmatic Usage

You can import and use the functions in your own scripts:

```javascript
const { makeRequest, runBenchmark, calculateStats } = require('./food-search-benchmark');

const queries = ['Apple', 'Banana', 'Orange'];
const results = await runBenchmark('production', queries);
const stats = calculateStats(results);
console.log(stats);
```

## License

MIT

## Support

For issues or questions, please refer to the main project documentation.

