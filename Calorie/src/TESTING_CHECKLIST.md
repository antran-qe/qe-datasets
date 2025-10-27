# 🧪 Testing Checklist

Use this checklist to verify everything is working correctly.

## ✅ Pre-Test Verification

### 1. Check File Structure
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie
ls -la src/
```

Expected files:
- [x] benchmark-cli.js
- [x] benchmark-viewer.html
- [x] compare-results.js
- [x] food-search-benchmark.js
- [x] food-search-input.json
- [x] package.json
- [x] README.md
- [x] run-benchmark.sh
- [x] USAGE_EXAMPLES.md
- [x] SETUP_COMPLETE.md
- [x] TESTING_CHECKLIST.md

### 2. Check Permissions
```bash
ls -la src/*.sh src/*.js | grep rwx
```

Expected executables:
- [x] run-benchmark.sh (rwxr-xr-x)
- [x] benchmark-cli.js (rwxr-xr-x)

### 3. Check Node.js Installation
```bash
node --version
```
Expected: v12.0.0 or higher

## 🧪 Test Cases

### Test 1: Run Interactive CLI
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src
node benchmark-cli.js
```

**Expected Result:**
- Menu displays correctly
- Can navigate options 1-7
- Exit works (option 7)

**Status:** [ ]

---

### Test 2: Run Production Benchmark
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src
node food-search-benchmark.js production food-search-input.json
```

**Expected Result:**
- Script starts successfully
- Shows progress for 10 queries
- Displays summary statistics
- Creates result file in `../test-results/`
- Result filename format: `prod-result-DD-MM-YYYY-HHMMSS.json`

**Status:** [ ]

**Output to verify:**
```
=== Running benchmark on PRODUCTION environment ===

[1/10] Testing: "Cheese, Cream, Ice Cream & Yogurts"
  ✓ Response time: XXXms | Status: 200 | Results: XX

...

=== PRODUCTION Summary ===
Total Requests: 10
Successful: X
Failed: X
Avg Response Time: XXX.XXms
Min Response Time: XXXms
Max Response Time: XXXms
Median Response Time: XXXms

✓ Results saved to: test-results/prod-result-XX-XX-XXXX-XXXXXX.json
```

---

### Test 3: Run Staging Benchmark
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src
node food-search-benchmark.js staging food-search-input.json
```

**Expected Result:**
- Same as Test 2 but with staging environment
- Result filename format: `stg-result-DD-MM-YYYY-HHMMSS.json`

**Status:** [ ]

**Note:** May fail if staging host is not configured correctly. This is expected.

---

### Test 4: Verify Result File Structure
```bash
cat ../test-results/prod-result-*.json | jq .
```

**Expected Result:**
- Valid JSON structure
- Contains `metadata`, `statistics`, `results` keys
- Each result has required fields:
  - search_description
  - response_time_ms
  - status_code
  - total_search_results
  - success
  - timestamp
  - environment

**Status:** [ ]

---

### Test 5: Compare Results
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src

# First, run two benchmarks
node food-search-benchmark.js production food-search-input.json
sleep 5
node food-search-benchmark.js production food-search-input.json

# Then compare
PROD1=$(ls -t ../test-results/prod-result-*.json | sed -n 1p)
PROD2=$(ls -t ../test-results/prod-result-*.json | sed -n 2p)
node compare-results.js $PROD1 $PROD2
```

**Expected Result:**
- Displays formatted comparison table
- Shows statistics for both files
- Shows query-by-query comparison
- Shows summary with performance difference

**Status:** [ ]

---

### Test 6: View Results in Browser
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie
python3 -m http.server 8000
```

Then open: `http://localhost:8000/src/benchmark-viewer.html`

**Expected Result:**
- Page loads without errors
- File selector shows available result files
- Can select a result file
- Statistics cards display correctly
- Bar chart renders
- Results table shows all queries
- Color coding works (success/failure, fast/slow)

**Status:** [ ]

---

### Test 7: Shell Script
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src
./run-benchmark.sh production
```

**Expected Result:**
- Same as Test 2
- Shell script successfully calls Node.js script

**Status:** [ ]

---

### Test 8: NPM Scripts
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src

# Test production
npm run test:prod

# Test staging
npm run test:stg
```

**Expected Result:**
- Both scripts run successfully
- Same output as direct Node.js calls

**Status:** [ ]

---

### Test 9: Edit Test Queries
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src
nano food-search-input.json
```

**Test changes:**
1. Add a new query: "Chocolate Cake"
2. Save file
3. Run benchmark again
4. Verify output includes 11 queries

**Status:** [ ]

---

### Test 10: Error Handling
```bash
cd /Users/an.vtran/Downloads/datasets/Calorie/src

# Test with invalid environment
node food-search-benchmark.js invalid food-search-input.json

# Test with missing input file
node food-search-benchmark.js production nonexistent.json

# Test with invalid JSON
echo "invalid json" > test-invalid.json
node food-search-benchmark.js production test-invalid.json
rm test-invalid.json
```

**Expected Result:**
- Script shows appropriate error messages
- Does not crash
- Exits with non-zero code

**Status:** [ ]

---

## 📊 Validation Criteria

### Performance Metrics
- [x] Response times are measured in milliseconds
- [x] Status codes are captured
- [x] Total search results are counted
- [x] Success/failure is determined correctly

### Data Quality
- [x] All 10 test queries are processed
- [x] Results are saved in correct format
- [x] Timestamps are in ISO format
- [x] Environment is correctly tagged

### File Structure
- [x] Result files have correct naming convention
- [x] JSON is properly formatted
- [x] Files are saved in test-results directory

### User Experience
- [x] Clear progress indicators
- [x] Summary statistics displayed
- [x] Error messages are helpful
- [x] File paths are shown

## 🐛 Common Issues & Solutions

### Issue: "node: command not found"
```bash
# Install Node.js
brew install node
# or download from https://nodejs.org/
```

### Issue: "Permission denied" on shell scripts
```bash
chmod +x src/run-benchmark.sh
chmod +x src/benchmark-cli.js
```

### Issue: "Cannot find module"
```bash
# Make sure you're in the correct directory
cd /Users/an.vtran/Downloads/datasets/Calorie/src
pwd
```

### Issue: "ECONNREFUSED" or "Request timeout"
- Check internet connection
- Verify API endpoint is accessible
- Check if you're behind a proxy
- Verify API credentials

### Issue: Results viewer shows no files
- Make sure you've run at least one benchmark
- Check that test-results directory exists
- Verify web server is running from Calorie directory

## 📝 Test Results Log

Date: _______________

Tester: _______________

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Interactive CLI | ⬜ Pass ⬜ Fail | |
| 2 | Production Benchmark | ⬜ Pass ⬜ Fail | |
| 3 | Staging Benchmark | ⬜ Pass ⬜ Fail | |
| 4 | Result File Structure | ⬜ Pass ⬜ Fail | |
| 5 | Compare Results | ⬜ Pass ⬜ Fail | |
| 6 | Browser Viewer | ⬜ Pass ⬜ Fail | |
| 7 | Shell Script | ⬜ Pass ⬜ Fail | |
| 8 | NPM Scripts | ⬜ Pass ⬜ Fail | |
| 9 | Edit Queries | ⬜ Pass ⬜ Fail | |
| 10 | Error Handling | ⬜ Pass ⬜ Fail | |

## ✅ Sign-off

- [ ] All tests passed
- [ ] Documentation reviewed
- [ ] Ready for production use

Approved by: _______________ Date: _______________

