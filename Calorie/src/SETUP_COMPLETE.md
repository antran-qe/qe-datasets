# ✅ Setup Complete - Food Search API Benchmark Tool

## 📦 What Was Created

### Core Files
- ✅ **food-search-benchmark.js** - Main benchmark script with performance measurement
- ✅ **food-search-input.json** - Test data with 10 food queries (exact, partial, invalid)
- ✅ **compare-results.js** - Tool to compare two benchmark results
- ✅ **benchmark-viewer.html** - Beautiful web UI for visualizing results
- ✅ **benchmark-cli.js** - Interactive command-line menu interface

### Helper Files
- ✅ **run-benchmark.sh** - Shell script for easy execution
- ✅ **package.json** - NPM scripts configuration
- ✅ **README.md** - Complete documentation
- ✅ **USAGE_EXAMPLES.md** - Real-world usage examples

### Sample Data
- ✅ **../test-results/sample-prod-result-25-10-2025-000000.json** - Example result file

## 🚀 Quick Start (Choose One Method)

### Method 1: Interactive CLI (Recommended)
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src
node benchmark-cli.js
```

### Method 2: Direct Command
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src
node food-search-benchmark.js production food-search-input.json
```

### Method 3: Using Shell Script
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src
./run-benchmark.sh production
```

### Method 4: Using NPM
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src
npm start
```

## 📊 Output Structure

Results will be saved in:
```
Calorie/test-results/
├── prod-result-DD-MM-YYYY-HHMMSS.json
└── stg-result-DD-MM-YYYY-HHMMSS.json
```

Each result file contains:
```json
{
  "metadata": {
    "environment": "production",
    "test_date": "ISO timestamp",
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
      "timestamp": "ISO timestamp",
      "environment": "production"
    }
    // ... more results
  ]
}
```

## 🎯 Test Data Included

The default test includes 10 food queries:

1. **Exact Category Name**: "Cheese, Cream, Ice Cream & Yogurts"
2. **Common Food**: "Apple"
3. **Specific Item**: "Chicken Breast"
4. **Generic Food**: "Pizza"
5. **Food Category**: "Salad"
6. **Simple Food**: "Rice"
7. **Partial Match**: "Choco" (for chocolate)
8. **Partial Match**: "Bana" (for banana)
9. **Invalid Name**: "xyzInvalidFood123"
10. **Special Chars**: "!@#$%^&*()"

## 🔧 Configuration

### Environments

Edit `food-search-benchmark.js` to configure environments:

```javascript
const CONFIG = {
  staging: {
    host: 'api.staging.vulcanlabs.co',  // ← Update staging host here
    protocol: 'https'
  },
  production: {
    host: 'api.vulcanlabs.co',
    protocol: 'https'
  }
};
```

### Headers

Update API credentials in `food-search-benchmark.js`:

```javascript
const HEADERS = {
  'x-vulcan-application-id': '6698870692',           // ← Your app ID
  'x-device-id': '3A65FAB2-699A-410F-8777-472151C7BD2F', // ← Your device ID
  // ... other headers
};
```

## 📈 Viewing Results

### Start Web Server
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie
python3 -m http.server 8000
```

### Open in Browser
```
http://localhost:8000/src/benchmark-viewer.html
```

The viewer provides:
- 📊 Statistics dashboard
- 📉 Response time bar chart
- 📋 Detailed results table
- 🔍 File selector to compare different runs

## 🔄 Comparing Results

### Using CLI
```bash
node benchmark-cli.js
# Select option 3: Compare two result files
```

### Using Command Line
```bash
node compare-results.js test-results/prod-result-XX.json test-results/stg-result-XX.json
```

## 💡 Common Tasks

### Run Test on Both Environments
```bash
# Production
node food-search-benchmark.js production food-search-input.json

# Staging
node food-search-benchmark.js staging food-search-input.json

# Compare
node compare-results.js test-results/prod-result-*.json test-results/stg-result-*.json
```

### Edit Test Queries
```bash
nano food-search-input.json
```

Or use the CLI (option 6).

### List All Results
```bash
ls -lh ../test-results/
```

Or use the CLI (option 5).

## 🎨 Features

### ✅ Performance Metrics
- Response time measurement (ms)
- Success/failure tracking
- HTTP status codes
- Result counts

### ✅ Statistics
- Average, Min, Max response times
- Median response time
- Success rate
- Total/successful/failed requests

### ✅ Data Visualization
- Beautiful web dashboard
- Bar charts for response times
- Color-coded performance indicators
- Sortable results table

### ✅ Comparison Tools
- Side-by-side comparison
- Percentage differences
- Performance improvements/regressions
- Query-by-query analysis

### ✅ Export & Share
- JSON output format
- Easy to parse and analyze
- Version control friendly
- CI/CD integration ready

## 🛠 Troubleshooting

### Issue: "Error loading input file"
**Solution**: Make sure you're in the correct directory
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src
```

### Issue: "Request timeout"
**Solution**: Check internet connection and API availability
```bash
curl -I https://api.vulcanlabs.co/calories/api/v2/public/food-database
```

### Issue: "Command not found: node"
**Solution**: Install Node.js
```bash
# On macOS with Homebrew
brew install node

# Or download from: https://nodejs.org/
```

### Issue: Results viewer not loading files
**Solution**: Make sure you started the server in the Calorie directory
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie
python3 -m http.server 8000
```

## 📚 Documentation

- **README.md** - Complete feature documentation
- **USAGE_EXAMPLES.md** - Real-world usage scenarios
- **BENCHMARK_QUICKSTART.md** - Quick reference guide

## 🎓 Next Steps

1. **Test the setup**
   ```bash
   node benchmark-cli.js
   ```

2. **Run your first benchmark**
   - Choose option 1 (Production) or 2 (Staging)

3. **View results**
   - Choose option 4 to start web server
   - Open browser to view dashboard

4. **Customize queries**
   - Edit `food-search-input.json`
   - Add your own test cases

5. **Compare performance**
   - Run tests on both environments
   - Use option 3 to compare results

## 📞 Support

For detailed documentation:
- Check `README.md` for complete feature list
- Check `USAGE_EXAMPLES.md` for advanced usage
- Check inline comments in source code

## 🎉 You're All Set!

Everything is ready to use. Just run:

```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src
node benchmark-cli.js
```

Happy benchmarking! 🚀

