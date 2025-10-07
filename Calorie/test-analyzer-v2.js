import fs from 'fs';
import path from 'path';
import { HTMLGalleryGenerator } from './generator_v2.js';

/**
 * Nutrition API Test Results Analyzer
 * Analyzes API predictions against ground truth and generates test reports
 */

class NutritionTestAnalyzer {
  constructor(config = {}) {
    this.resultsDir = config.resultsDir || './';
    this.outputPath = config.outputPath || 'test-results-gallery.html';
    this.originalJsonPath = config.originalJsonPath || 'data_output.json';
    this.tolerances = {
      calories: config.caloriesTolerance || 15, // ≤15% per item
      macros: config.macrosTolerance || 25      // ≤25% per item (fat, carb, protein)
    };
    this.passCriteria = {
      maxExceedingItems: config.maxExceedingItems || 10, // ≤10% of items exceed calorie tolerance
      overallCaloriesMAPE: config.overallCaloriesMAPE || 12 // overall calories MAPE ≤12%
    };
  }

  // Helper function to format date to GMT+7
  formatDate(isoString) {
    try {
      const date = new Date(isoString);
      // Convert to GMT+7 (Vietnam timezone)
      const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
      
      const year = vietnamTime.getUTCFullYear();
      const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
      const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
      const hours = String(vietnamTime.getUTCHours()).padStart(2, '0');
      const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, '0');
      const seconds = String(vietnamTime.getUTCSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return isoString; // Return original if parsing fails
    }
  }

  // Read all JSON result files from directory
  readResultFiles() {
    try {
      const files = fs.readdirSync(this.resultsDir)
        .filter(file => file.endsWith('.json') && file.includes('nutrition') && file.includes('result'))
        .map(file => ({
          filename: file,
          path: path.join(this.resultsDir, file),
          data: JSON.parse(fs.readFileSync(path.join(this.resultsDir, file), 'utf8'))
        }));
      
      console.log(`Found ${files.length} result files`);
      return files;
    } catch (error) {
      console.error(`Error reading result files: ${error.message}`);
      throw error;
    }
  }

  // Calculate MAPE (Mean Absolute Percentage Error)
  calculateMAPE(actual, predicted) {
    if (actual === 0) return predicted === 0 ? 0 : 100; // Handle division by zero
    return Math.abs((actual - predicted) / actual) * 100;
  }

  // Normalize API predictions based on serving size
  normalizeNutrients(apiResult, servingsInImage) {
    if (!servingsInImage || servingsInImage <= 1) {
      return apiResult;
    }

    return {
      ...apiResult,
      total_calories: apiResult.total_calories / servingsInImage,
      fats: apiResult.fats / servingsInImage,
      carbohydrates: apiResult.carbohydrates / servingsInImage,
      proteins: apiResult.proteins / servingsInImage
    };
  }

  // Analyze single test result file, with fallback to original JSON for missing ground truth
  analyzeTestResult(resultData, originalDataArr = null) {
    const analysis = {
      metadata: resultData.metadata,
      summary: {
        totalItems: 0,
        successfulPredictions: 0,
        failedPredictions: 0,
        itemsWithoutImages: 0,
        caloriesExceedingTolerance: 0,
        macrosExceedingTolerance: 0
      },
      metrics: {
        calories: { mape: 0, exceedingCount: 0, values: [] },
        fat: { mape: 0, exceedingCount: 0, values: [] },
        carb: { mape: 0, exceedingCount: 0, values: [] },
        protein: { mape: 0, exceedingCount: 0, values: [] }
      },
      itemDetails: [],
      passStatus: {
        calorieTolerancePass: false,
        overallCaloriesMAPEPass: false,
        overallPass: false
      },
      // Add response time analytics
      responseTimeStats: {
        min: resultData.summary?.api_response_time_min_ms || null,
        max: resultData.summary?.api_response_time_max_ms || null,
        avg: resultData.summary?.api_response_time_avg_ms || null,
        count: 0
      }
    };

    // Build a lookup for original ground truth if available
    let groundTruthLookup = null;
    if (originalDataArr && Array.isArray(originalDataArr)) {
      groundTruthLookup = {};
      for (const item of originalDataArr) {
        if (item.item_id != null && item.nutrients_per_serving) {
          groundTruthLookup[item.item_id] = item.nutrients_per_serving;
        }
      }
    } else {
      try {
        const arr = JSON.parse(fs.readFileSync(this.originalJsonPath, 'utf8'));
        groundTruthLookup = {};
        for (const item of arr) {
          if (item.item_id != null && item.nutrients_per_serving) {
            groundTruthLookup[item.item_id] = item.nutrients_per_serving;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    analysis.summary.totalItems = resultData.results.length;
    analysis.summary.failedPredictions = resultData.results.filter(item => 
      item.processing_info.has_image && !item.processing_info.success
    ).length;
    analysis.summary.itemsWithoutImages = resultData.results.filter(item => 
      !item.processing_info.has_image
    ).length;

    // Analyze each item (try to get ground truth from result, else fallback)
    let successfulPredictions = 0;
    let total_caloriesMAPE = 0;
    for (const item of resultData.results) {
      if (!item.processing_info.success) continue;
      let original = item.original_data.nutrients_per_serving;
      let servingsInImage = item.original_data.servings_size_in_image;
      if (!original && groundTruthLookup && item.original_data.item_id != null) {
        original = groundTruthLookup[item.original_data.item_id];
        // Try to get correct servingsInImage from ground truth source if available
        if (originalDataArr && Array.isArray(originalDataArr)) {
          const gtItem = originalDataArr.find(gt => gt.item_id === item.original_data.item_id);
          if (gtItem && gtItem.servings_size_in_image != null) {
            servingsInImage = gtItem.servings_size_in_image;
          }
        }
      }
      if (servingsInImage == null) servingsInImage = 1;
      if (!original) continue; // still missing, skip
      successfulPredictions++;
      const normalized = this.normalizeNutrients(item.api_result, servingsInImage);

      // Calculate MAPE for each nutrient
      const caloriesMAPE = this.calculateMAPE(original.calories, normalized.total_calories);
      const fatMAPE = this.calculateMAPE(original.fat, normalized.fats);
      const carbMAPE = this.calculateMAPE(original.carb, normalized.carbohydrates);
      const proteinMAPE = this.calculateMAPE(original.protein, normalized.proteins);
      // console.log(`Item ID: ${item.original_data.item_id}, Calories MAPE: ${caloriesMAPE}`);
      // total_caloriesMAPE += caloriesMAPE;
      // Check tolerances
      const caloriesExceedsTolerance = caloriesMAPE > this.tolerances.calories;
      const fatExceedsTolerance = fatMAPE > this.tolerances.macros;
      const carbExceedsTolerance = carbMAPE > this.tolerances.macros;
      const proteinExceedsTolerance = proteinMAPE > this.tolerances.macros;

      if (caloriesExceedsTolerance) analysis.summary.caloriesExceedingTolerance++;
      if (fatExceedsTolerance || carbExceedsTolerance || proteinExceedsTolerance) {
        analysis.summary.macrosExceedingTolerance++;
      }

      // Store values for overall MAPE calculation
      analysis.metrics.calories.values.push(caloriesMAPE);
      analysis.metrics.fat.values.push(fatMAPE);
      analysis.metrics.carb.values.push(carbMAPE);
      analysis.metrics.protein.values.push(proteinMAPE);

      // Get response time for this item
      const responseTime = item.processing_info?.api_response_time_ms || null;
      // Store item details
      analysis.itemDetails.push({
        itemId: item.original_data.item_id,
        foodName: item.original_data.name_food,
        servingsInImage: servingsInImage,
        original: original,
        predicted: normalized,
        apiPredicted: [item.api_result,item.processing_info],
        confidence: item.api_result.confidence,
        responseTime: responseTime,
        mape: {
          calories: caloriesMAPE,
          fat: fatMAPE,
          carb: carbMAPE,
          protein: proteinMAPE
        },
        toleranceStatus: {
          calories: caloriesExceedsTolerance,
          fat: fatExceedsTolerance,
          carb: carbExceedsTolerance,
          protein: proteinExceedsTolerance
        }
      });
    }
    console.log('Total Calories MAPE accumulated:', total_caloriesMAPE);
    analysis.summary.successfulPredictions = successfulPredictions;

    // Calculate overall MAPE for each nutrient
  // Diagnostics: print sum and count for calories MAPE
  const calSum = analysis.metrics.calories.values.reduce((sum, val) => sum + val, 0);
  const calCount = analysis.metrics.calories.values.length;
  console.log('Calories MAPE sum:', calSum, 'Count:', calCount);
  analysis.metrics.calories.mape = calSum / calCount || 0;
  analysis.metrics.fat.mape = analysis.metrics.fat.values.reduce((sum, val) => sum + val, 0) / analysis.metrics.fat.values.length || 0;
  analysis.metrics.carb.mape = analysis.metrics.carb.values.reduce((sum, val) => sum + val, 0) / analysis.metrics.carb.values.length || 0;
  analysis.metrics.protein.mape = analysis.metrics.protein.values.reduce((sum, val) => sum + val, 0) / analysis.metrics.protein.values.length || 0;

    // Calculate pass criteria
    const calorieExceedingPercentage = (analysis.summary.caloriesExceedingTolerance / (analysis.summary.successfulPredictions || 1)) * 100;
    analysis.passStatus.calorieTolerancePass = calorieExceedingPercentage <= this.passCriteria.maxExceedingItems;
    analysis.passStatus.overallCaloriesMAPEPass = analysis.metrics.calories.mape <= this.passCriteria.overallCaloriesMAPE;
    analysis.passStatus.overallPass = analysis.passStatus.calorieTolerancePass && analysis.passStatus.overallCaloriesMAPEPass;
// Calculate response time count for successful requests
    analysis.responseTimeStats.count = analysis.itemDetails.filter(item => item.responseTime !== null).length;

    // Diagnostics: log top 10 items with highest calories MAPE
    if (analysis.itemDetails.length > 0) {
      const sortedByCalMAPE = [...analysis.itemDetails].sort((a, b) => b.mape.calories - a.mape.calories);
      console.log('Top 10 items by Calories MAPE:');
      sortedByCalMAPE.slice(0, 10).forEach(item => {
        console.log(`ID: ${item.itemId}, Food: ${item.foodName}, Calories MAPE: ${item.mape.calories.toFixed(2)}%, GT: ${item.original.calories}, Pred: ${item.predicted.total_calories}`);
      });
      const failedItems = analysis.itemDetails.filter(item => item.toleranceStatus.calories || item.toleranceStatus.fat || item.toleranceStatus.carb || item.toleranceStatus.protein);
      if (failedItems.length > 0) {
        console.log('Sample failing items (tolerance exceeded):');
        failedItems.slice(0, 10).forEach(item => {
          console.log(`ID: ${item.itemId}, Food: ${item.foodName}, Calories MAPE: ${item.mape.calories.toFixed(2)}%, Fat MAPE: ${item.mape.fat.toFixed(2)}%, Carb MAPE: ${item.mape.carb.toFixed(2)}%, Protein MAPE: ${item.mape.protein.toFixed(2)}%`);
        });
      }
    }
    return analysis;
  }

  // Generate HTML report content
  generateTestReportHTML(analyses) {
    // Sort analyses by date (newest first, left to right)
    const sortedAnalyses = [...analyses].sort((a, b) => 
      new Date(b.analysis.metadata.run_date) - new Date(a.analysis.metadata.run_date)
    );

    const testTabs = sortedAnalyses.map((analysisObj, index) => `
      <button class="tab-button ${index === 0 ? 'active' : ''}" onclick="openTab(event, 'test-${index}')">
        Test Run ${this.formatDate(analysisObj.analysis.metadata.run_date)}
      </button>
    `).join('');

    const testContents = sortedAnalyses.map((analysisObj, index) => `
      <div id="test-${index}" class="tab-content ${index === 0 ? 'active' : ''}">
        ${this.generateSingleTestReport(analysisObj.analysis, index)}
      </div>
    `).join('');

    return `
      <div class="test-results-section">
        <div class="test-header">
          <h2>🧪 Test Results</h2>
          <div class="test-tabs">
            ${testTabs}
          </div>
        </div>
        
        <div class="test-content">
          ${testContents}
        </div>
      </div>
    `;
  }

  // Generate single test report
  generateSingleTestReport(analysis, tabIndex = 0) {
    const passIcon = analysis.passStatus.overallPass ? '✅' : '❌';
    const passClass = analysis.passStatus.overallPass ? 'pass' : 'fail';
    const formatResponseTime = (time) => time !== null ? `${time}ms` : 'N/A';
    return `
      <div class="test-report">
        <!-- Summary Section -->
        <div class="summary-section">
          <div class="summary-header">
            <h3>📊 Test Summary</h3>
            <div class="overall-status ${passClass}">
              ${passIcon} ${analysis.passStatus.overallPass ? 'PASS' : 'FAIL'}
            </div>
          </div>
          
          <div class="summary-grid">
            <div class="summary-card">
              <div class="card-title">Run Information</div>
              <div class="card-content">
                <div class="stat-item">
                  <span class="stat-label">Run Date:</span>
                  <span class="stat-value">${this.formatDate(analysis.metadata.run_date)}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Endpoint:</span><br/>
                  <span class="stat-value">${analysis.filename || 'N/A'}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Endpoint:</span><br/>
                  <span class="stat-value">${analysis.metadata.api_endpoint || 'N/A'}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Total Items:</span>
                  <span class="stat-value">${analysis.summary.totalItems}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Successful Predictions:</span>
                  <span class="stat-value">${analysis.summary.successfulPredictions}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Failed Predictions:</span>
                  <span class="stat-value">${analysis.summary.failedPredictions}</span>
                </div>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-title">Response Time Statistics</div>
              <div class="card-content">
                <div class="stat-item">
                  <span class="stat-label">Min Response Time:</span>
                  <span class="stat-value">${formatResponseTime(analysis.responseTimeStats.min)}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Max Response Time:</span>
                  <span class="stat-value">${formatResponseTime(analysis.responseTimeStats.max)}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Avg Response Time:</span>
                  <span class="stat-value">${formatResponseTime(analysis.responseTimeStats.avg)}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Measured Requests:</span>
                  <span class="stat-value">${analysis.responseTimeStats.count}</span>
                </div>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-title">MAPE Metrics</div>
              <div class="card-content">
                <div class="stat-item ${analysis.passStatus.overallCaloriesMAPEPass ? 'pass' : 'fail'}">
                  <span class="stat-label">Calories MAPE:</span>
                  <span class="stat-value">${analysis.metrics.calories.mape.toFixed(2)}%</span>
                  <span class="threshold">(≤${this.passCriteria.overallCaloriesMAPE}%)</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Fat MAPE:</span>
                  <span class="stat-value">${analysis.metrics.fat.mape.toFixed(2)}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Carb MAPE:</span>
                  <span class="stat-value">${analysis.metrics.carb.mape.toFixed(2)}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Protein MAPE:</span>
                  <span class="stat-value">${analysis.metrics.protein.mape.toFixed(2)}%</span>
                </div>
              </div>
            </div>
            
            <div class="summary-card">
              <div class="card-title">Tolerance Check</div>
              <div class="card-content">
                <div class="stat-item ${analysis.passStatus.calorieTolerancePass ? 'pass' : 'fail'}">
                  <span class="stat-label">Items Exceeding Calorie Tolerance:</span>
                  <span class="stat-value">${analysis.summary.caloriesExceedingTolerance}</span>
                  <span class="percentage">(${((analysis.summary.caloriesExceedingTolerance / analysis.summary.successfulPredictions) * 100).toFixed(1)}%)</span>
                  <span class="threshold">(≤${this.passCriteria.maxExceedingItems}%)</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Items Exceeding Macro Tolerance:</span>
                  <span class="stat-value">${analysis.summary.macrosExceedingTolerance}</span>
                  <span class="percentage">(${((analysis.summary.macrosExceedingTolerance / analysis.summary.successfulPredictions) * 100).toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Results -->
        <div class="details-section">
          <h3>📋 Detailed Results</h3>
          <div class="filter-controls">
            <button class="filter-btn active" onclick="filterResults('all', this)">All Items</button>
            <button class="filter-btn" onclick="filterResults('pass', this)">Passing Items</button>
            <button class="filter-btn" onclick="filterResults('fail', this)">Failing Items</button>
          </div>
          
          <div class="results-table">
            <table>
              <thead>
                <tr>
                  <th>Item ID</th>
                  <th>Food Name</th>
                  <th>Response Time (ms)</th>
                  <th>Servings</th>
                  <th>Calories</th>
                  <th>Fat (g)</th>
                  <th>Carb (g)</th>
                  <th>Protein (g)</th>
                  <th>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${analysis.itemDetails.map(item => this.generateItemRow(item, tabIndex)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // Generate individual item row
  generateItemRow(item, tabIndex = 0) {
    const hasCalorieIssue = item.toleranceStatus.calories;
    const hasMacroIssue = item.toleranceStatus.fat || item.toleranceStatus.carb || item.toleranceStatus.protein;
    const overallStatus = hasCalorieIssue || hasMacroIssue ? 'fail' : 'pass';
    const statusIcon = overallStatus === 'pass' ? '✅' : '❌';
    const responseTimeDisplay = item.responseTime !== null ? item.responseTime : 'N/A';
    // Create unique IDs for this tab
    const uniqueItemId = `${tabIndex}-${item.itemId}`;

    // Main row
    const mainRow = `
      <tr class="item-row ${overallStatus}" data-status="${overallStatus}">
        <td>
          <div class="item-id-container">
            <button class="expand-btn" onclick="toggleApiResult('${uniqueItemId}')" title="View raw API result">
              <span class="expand-icon">▼</span>
            </button>
            <span>${item.itemId}</span>
          </div>
        </td>
        <td class="food-name">${item.foodName}</td>
        <td class="response-time">${responseTimeDisplay}</td>
        <td>${item.servingsInImage}</td>
        <td class="nutrient-cell ${item.toleranceStatus.calories ? 'exceed' : ''}">
          <div class="nutrient-comparison">
            <span class="actual">${item.original.calories.toFixed(1)}</span>
            <span class="vs">vs</span>
            <span class="predicted">${item.predicted.total_calories.toFixed(1)}</span>
          </div>
          <div class="mape ${item.toleranceStatus.calories ? 'exceed' : ''}">${item.mape.calories.toFixed(1)}%</div>
        </td>
        <td class="nutrient-cell ${item.toleranceStatus.fat ? 'exceed' : ''}">
          <div class="nutrient-comparison">
            <span class="actual">${item.original.fat.toFixed(1)}</span>
            <span class="vs">vs</span>
            <span class="predicted">${item.predicted.fats.toFixed(1)}</span>
          </div>
          <div class="mape ${item.toleranceStatus.fat ? 'exceed' : ''}">${item.mape.fat.toFixed(1)}%</div>
        </td>
        <td class="nutrient-cell ${item.toleranceStatus.carb ? 'exceed' : ''}">
          <div class="nutrient-comparison">
            <span class="actual">${item.original.carb.toFixed(1)}</span>
            <span class="vs">vs</span>
            <span class="predicted">${item.predicted.carbohydrates.toFixed(1)}</span>
          </div>
          <div class="mape ${item.toleranceStatus.carb ? 'exceed' : ''}">${item.mape.carb.toFixed(1)}%</div>
        </td>
        <td class="nutrient-cell ${item.toleranceStatus.protein ? 'exceed' : ''}">
          <div class="nutrient-comparison">
            <span class="actual">${item.original.protein.toFixed(1)}</span>
            <span class="vs">vs</span>
            <span class="predicted">${item.predicted.proteins.toFixed(1)}</span>
          </div>
          <div class="mape ${item.toleranceStatus.protein ? 'exceed' : ''}">${item.mape.protein.toFixed(1)}%</div>
        </td>
        <td>${item.confidence}%</td>
        <td class="status-cell">
          <span class="status-badge ${overallStatus}">${statusIcon}</span>
        </td>
      </tr>
    `;

    // API Result row (expandable)
    const apiResultRow = `
      <tr id="api-result-${uniqueItemId}" class="api-result-row" style="display: none;">
        <td colspan="9">
          <div class="api-result-container">
            <h4>Raw API Result for Item ${item.itemId}</h4>
            <div class="api-result-content">
              <div class="json-container">
                <pre class="json-display">${JSON.stringify(item.apiPredicted, null, 2)}</pre>
              </div>
            </div>
          </div>
        </td>
      </tr>
    `;

    return mainRow + apiResultRow;
  }

  // Generate enhanced gallery with test results
  async generateEnhancedGallery(originalJsonPath, imagesDir) {
    console.log('Reading result files...');
    const resultFiles = this.readResultFiles();

    // Read original data for gallery and fallback lookup
    const originalData = JSON.parse(fs.readFileSync(originalJsonPath, 'utf8'));

    console.log('Analyzing test results...');
    const analyses = resultFiles.map(file => ({
      filename: file.filename,
      runDate: file.data.metadata.run_date,
      analysis: this.analyzeTestResult(file.data, originalData)
    }));

    console.log('Generating enhanced gallery...');

    // Create a combined generator that includes test results
    const generator = new HTMLGalleryGenerator(originalJsonPath, imagesDir, this.outputPath);
    const processedData = generator.processImages(originalData);

    // Generate base HTML and inject test results
    const baseHTML = generator.generateHTML(processedData);

    // Insert test results section
    const testResultsHTML = this.generateTestReportHTML(analyses);
    const testResultsCSS = this.generateTestResultsCSS();
    const testResultsJS = this.generateTestResultsJS();

    // Modify the base HTML to include tabs
    const enhancedHTML = this.injectTestResults(baseHTML, testResultsHTML, testResultsCSS, testResultsJS);

    // Write enhanced HTML file
    fs.writeFileSync(this.outputPath, enhancedHTML, 'utf8');

    console.log(`Enhanced gallery with test results generated: ${this.outputPath}`);
    console.log(`Test runs analyzed: ${analyses.length}`);

    // Print summary
    analyses.forEach((analysisObj, index) => {
      const pass = analysisObj.analysis.passStatus.overallPass;
      console.log(`Test Run ${analysisObj.analysis.metadata.run_date} (${analysisObj.filename}): ${pass ? 'PASS' : 'FAIL'}`);
    });

    return this.outputPath;
  }

  // Inject test results into base HTML
  injectTestResults(baseHTML, testResultsHTML, testResultsCSS, testResultsJS) {
    // Add main navigation tabs HTML
    const mainTabsHTML = `
      <div class="main-tabs">
        <button class="main-tab-button active" onclick="openMainTab(event, 'gallery-tab')">🍽️ Food Gallery</button>
        <button class="main-tab-button" onclick="openMainTab(event, 'test-results-tab')">🧪 Test Results</button>
      </div>
    `;

    // Find and replace the container opening to add main tabs
    let modifiedHTML = baseHTML.replace(
      '<div class="container">',
      `<div class="container">\n${mainTabsHTML}`
    );

    // Wrap the existing gallery content in a tab container
    // Find the search box and wrap everything from there until the closing container
    const searchBoxPattern = /<input type="text" class="search-box"[^>]*>/;
    const searchBoxMatch = modifiedHTML.match(searchBoxPattern);
    
    if (searchBoxMatch) {
      const searchBoxHTML = searchBoxMatch[0];
      const beforeSearchBox = modifiedHTML.substring(0, modifiedHTML.indexOf(searchBoxHTML));
      const afterSearchBox = modifiedHTML.substring(modifiedHTML.indexOf(searchBoxHTML) + searchBoxHTML.length);
      
      // Find the food list div
      const foodListStart = afterSearchBox.indexOf('<div id="foodList"');
      const beforeFoodList = afterSearchBox.substring(0, foodListStart);
      const fromFoodList = afterSearchBox.substring(foodListStart);
      
      // Find the end of the container content (before scroll button)
      const scrollButtonIndex = fromFoodList.indexOf('<button class="scroll-to-top"');
      const foodListContent = fromFoodList.substring(0, scrollButtonIndex);
      const afterContainer = fromFoodList.substring(scrollButtonIndex);
      
      // Reconstruct with proper tab structure
      modifiedHTML = beforeSearchBox + 
        `<div id="gallery-tab" class="main-tab-content active">\n` +
        searchBoxHTML + 
        beforeFoodList + 
        foodListContent + 
        `</div>\n` +
        `<div id="test-results-tab" class="main-tab-content">\n` +
        testResultsHTML + 
        `</div>\n\n` +
        afterContainer;
    }

    // Insert CSS
    modifiedHTML = modifiedHTML.replace('</style>', testResultsCSS + '\n</style>');
    
    // Insert JavaScript before the closing script tag
    modifiedHTML = modifiedHTML.replace('</script>', testResultsJS + '\n</script>');
    
    return modifiedHTML;
  }

  // Generate CSS for test results
  generateTestResultsCSS() {
    return `
        /* Main Tabs */
        .main-tabs {
            display: flex;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 4px;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
        }

        .main-tab-button {
            flex: 1;
            background: transparent;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.7);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
        }

        .main-tab-button.active,
        .main-tab-button:hover {
            background: white;
            color: #4a5568;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .main-tab-content {
            display: none;
        }

        .main-tab-content.active {
            display: block;
        }

        /* Test Results Styles */
        .test-results-section {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .test-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
        }

        .test-header h2 {
            margin: 0 0 15px 0;
            font-size: 1.8em;
        }

        .test-tabs {
            display: flex;
            gap: 8px;
        }

        .tab-button {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 12px;
            font-weight: 600;
        }

        .tab-button.active,
        .tab-button:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .test-content {
            padding: 0;
        }

        .tab-content {
            display: none;
            padding: 25px;
        }

        .tab-content.active {
            display: block;
        }

        .summary-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .overall-status {
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 14px;
        }

        .overall-status.pass {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
        }

        .overall-status.fail {
            background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
            color: white;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .summary-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #e2e8f0;
        }

        .card-title {
            font-size: 14px;
            font-weight: 700;
            color: #4a5568;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .stat-item:last-child {
            border-bottom: none;
        }

        .stat-label {
            font-size: 12px;
            color: #718096;
        }

        .stat-value {
            font-weight: 700;
            color: #2d3748;
        }

        .threshold {
            font-size: 10px;
            color: #a0aec0;
            margin-left: 5px;
        }

        .percentage {
            font-size: 11px;
            color: #718096;
            margin-left: 5px;
        }

        .stat-item.pass {
            background: rgba(72, 187, 120, 0.1);
            border-radius: 6px;
            padding: 8px 12px;
            margin: 4px 0;
        }

        .stat-item.fail {
            background: rgba(245, 101, 101, 0.1);
            border-radius: 6px;
            padding: 8px 12px;
            margin: 4px 0;
        }

        .filter-controls {
            margin-bottom: 15px;
            display: flex;
            gap: 10px;
        }

        .filter-btn {
            background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
            border: none;
            color: #4a5568;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 12px;
            font-weight: 600;
        }

        .filter-btn.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .results-table {
            overflow-x: auto;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }

        .results-table table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }

        .results-table th {
            background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .results-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11px;
        }

        .item-row.pass {
            background: rgba(72, 187, 120, 0.05);
        }

        .item-row.fail {
            background: rgba(245, 101, 101, 0.05);
        }

        .food-name {
            font-weight: 600;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .response-time {
            text-align: center;
            font-weight: 600;
            color: #4a5568;
        }

        .nutrient-cell {
            text-align: center;
            min-width: 80px;
        }

        .nutrient-comparison {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            margin-bottom: 2px;
        }

        .actual {
            color: #4a5568;
            font-weight: 600;
        }

        .vs {
            color: #a0aec0;
            font-size: 9px;
        }

        .predicted {
            color: #667eea;
            font-weight: 600;
        }

        .mape {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            background: rgba(72, 187, 120, 0.1);
            color: #38a169;
        }

        .mape.exceed {
            background: rgba(245, 101, 101, 0.1);
            color: #e53e3e;
        }

        .nutrient-cell.exceed {
            background: rgba(245, 101, 101, 0.1);
        }

        .status-cell {
            text-align: center;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 700;
        }

        .status-badge.pass {
            background: rgba(72, 187, 120, 0.1);
            color: #38a169;
        }

        .status-badge.fail {
            background: rgba(245, 101, 101, 0.1);
            color: #e53e3e;
        }

        /* Expandable API Result Styles */
        .item-id-container {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .expand-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .expand-btn:hover {
            background: rgba(0, 0, 0, 0.1);
        }

        .expand-btn.expanded {
            background: rgba(102, 126, 234, 0.1);
        }

        .expand-icon {
            font-size: 10px;
            color: #4a5568;
            transition: transform 0.3s ease;
        }

        .expand-btn.expanded .expand-icon {
            transform: rotate(180deg);
        }

        .api-result-row {
            background: #f8f9fa !important;
        }

        .api-result-container {
            padding: 15px;
            border-left: 4px solid #667eea;
            background: white;
            margin: 5px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .api-result-container h4 {
            margin: 0 0 10px 0;
            color: #4a5568;
            font-size: 12px;
            font-weight: 700;
        }

        .api-result-content {
            max-height: 300px;
            overflow-y: auto;
        }

        .json-container {
            background: #2d3748;
            border-radius: 6px;
            padding: 10px;
            border: 1px solid #e2e8f0;
        }

        .json-display {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.4;
            margin: 0;
            white-space: pre-wrap;
            color: #e2e8f0;
            background: transparent;
        }

        @media (max-width: 768px) {
            .summary-grid {
                grid-template-columns: 1fr;
            }
            
            .results-table {
                font-size: 10px;
            }
            
            .results-table th,
            .results-table td {
                padding: 6px 4px;
            }

            .api-result-container {
                padding: 10px;
            }

            .json-display {
                font-size: 10px;
            }
        }
    `;
  }

  // Generate JavaScript for test results
  generateTestResultsJS() {
    return `
        function openMainTab(evt, tabName) {
            var i, tabcontent, tablinks;
            
            tabcontent = document.getElementsByClassName("main-tab-content");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].classList.remove("active");
            }
            
            tablinks = document.getElementsByClassName("main-tab-button");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].classList.remove("active");
            }
            
            document.getElementById(tabName).classList.add("active");
            evt.currentTarget.classList.add("active");
        }

        function openTab(evt, tabName) {
            var i, tabcontent, tablinks;
            
            tabcontent = document.getElementsByClassName("tab-content");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].classList.remove("active");
            }
            
            tablinks = document.getElementsByClassName("tab-button");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].classList.remove("active");
            }
            
            document.getElementById(tabName).classList.add("active");
            evt.currentTarget.classList.add("active");
        }

        function filterResults(status, button) {
            // Update button states
            document.querySelectorAll('.filter-btn').forEach(function(btn) {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            // Get the current active tab content
            var activeTabContent = document.querySelector('.tab-content.active');
            if (!activeTabContent) return;
            
            // Filter table rows within the active tab only
            activeTabContent.querySelectorAll('.item-row').forEach(function(row) {
                var itemIdSpan = row.querySelector('.item-id-container span');
                if (!itemIdSpan) return;
                
                var itemId = itemIdSpan.textContent;
                var expandBtn = row.querySelector('.expand-btn');
                var tabId = activeTabContent.id.split('-')[1]; // Extract tab index
                var uniqueItemId = tabId + '-' + itemId;
                var apiResultRow = document.getElementById('api-result-' + uniqueItemId);
                
                if (status === 'all') {
                    row.style.display = '';
                } else {
                    var shouldShow = row.dataset.status === status;
                    row.style.display = shouldShow ? '' : 'none';
                    
                    // Hide API result row if main row is hidden
                    if (apiResultRow && !shouldShow) {
                        apiResultRow.style.display = 'none';
                        if (expandBtn) {
                            var expandIcon = expandBtn.querySelector('.expand-icon');
                            expandBtn.classList.remove('expanded');
                            if (expandIcon) expandIcon.innerHTML = '▼';
                        }
                    }
                }
            });
        }

        function toggleApiResult(uniqueItemId) {
            var apiResultRow = document.getElementById('api-result-' + uniqueItemId);
            var expandBtn = document.querySelector('[onclick="toggleApiResult(\\'' + uniqueItemId + '\\')"]');
            
            if (!apiResultRow || !expandBtn) return;
            
            var expandIcon = expandBtn.querySelector('.expand-icon');
            
            if (apiResultRow.style.display === 'none' || apiResultRow.style.display === '') {
                // Show the API result
                apiResultRow.style.display = 'table-row';
                expandBtn.classList.add('expanded');
                if (expandIcon) expandIcon.innerHTML = '▲';
            } else {
                // Hide the API result
                apiResultRow.style.display = 'none';
                expandBtn.classList.remove('expanded');
                if (expandIcon) expandIcon.innerHTML = '▼';
            }
        }
    `;
  }
}

// Usage function
async function generateTestResults(config = {}) {
  try {
    const analyzer = new NutritionTestAnalyzer(config);
    const outputPath = await analyzer.generateEnhancedGallery(
      config.originalJsonPath || 'data_output.json',
      config.imagesDir || './images'
    );
    
    return outputPath;
  } catch (error) {
    console.error('Failed to generate test results:', error);
    process.exit(1);
  }
}

// Export for use as module
export { NutritionTestAnalyzer, generateTestResults };

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = {
    resultsDir: process.argv[2] || './',
    originalJsonPath: process.argv[3] || 'data_output.json',
    imagesDir: process.argv[4] || './images',
    outputPath: process.argv[5] || 'test-results-gallery-0110202502.html'
  };
  
  console.log('Configuration:');
  console.log(`  Results directory: ${config.resultsDir}`);
  console.log(`  Original JSON: ${config.originalJsonPath}`);
  console.log(`  Images directory: ${config.imagesDir}`);
  console.log(`  Output file: ${config.outputPath}`);
  
  generateTestResults(config);
}