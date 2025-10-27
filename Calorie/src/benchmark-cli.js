#!/usr/bin/env node

/**
 * Interactive CLI for Food Search API Benchmark
 */

const readline = require('readline');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function clearScreen() {
  console.clear();
}

function printHeader() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║        🍔 FOOD SEARCH API BENCHMARK TOOL 🍔                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
}

function printMenu() {
  console.log('What would you like to do?\n');
  console.log('  1. Run benchmark on PRODUCTION');
  console.log('  2. Run benchmark on STAGING');
  console.log('  3. Compare two result files');
  console.log('  4. View results in browser');
  console.log('  5. List existing result files');
  console.log('  6. Edit test queries');
  console.log('  7. Exit\n');
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    proc.on('error', (error) => {
      reject(error);
    });
  });
}

async function runBenchmark(environment) {
  console.log(`\n🚀 Running benchmark on ${environment.toUpperCase()}...\n`);
  
  const scriptPath = path.join(__dirname, 'food-search-benchmark.js');
  const inputPath = path.join(__dirname, 'food-search-input.json');
  
  try {
    await runCommand('node', [scriptPath, environment, inputPath]);
    console.log(`\n✅ Benchmark completed successfully!`);
  } catch (error) {
    console.error(`\n❌ Error running benchmark:`, error.message);
  }
  
  await question('\nPress Enter to continue...');
}

async function compareResults() {
  const resultsDir = path.join(__dirname, '..', 'test-results');
  
  if (!fs.existsSync(resultsDir)) {
    console.log('\n⚠️  No results directory found.');
    await question('\nPress Enter to continue...');
    return;
  }
  
  const files = fs.readdirSync(resultsDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length < 2) {
    console.log('\n⚠️  Need at least 2 result files to compare.');
    await question('\nPress Enter to continue...');
    return;
  }
  
  console.log('\n📁 Available result files:\n');
  files.forEach((file, i) => {
    console.log(`  ${i + 1}. ${file}`);
  });
  
  const file1Index = await question('\nSelect first file number: ');
  const file2Index = await question('Select second file number: ');
  
  const file1 = files[parseInt(file1Index) - 1];
  const file2 = files[parseInt(file2Index) - 1];
  
  if (!file1 || !file2) {
    console.log('\n❌ Invalid file selection.');
    await question('\nPress Enter to continue...');
    return;
  }
  
  console.log('\n');
  
  try {
    const comparePath = path.join(__dirname, 'compare-results.js');
    const file1Path = path.join(resultsDir, file1);
    const file2Path = path.join(resultsDir, file2);
    
    await runCommand('node', [comparePath, file1Path, file2Path]);
  } catch (error) {
    console.error(`\n❌ Error comparing results:`, error.message);
  }
  
  await question('\nPress Enter to continue...');
}

async function viewResults() {
  console.log('\n🌐 Starting web server...\n');
  console.log('Server will start on http://localhost:8000');
  console.log('Open: http://localhost:8000/src/benchmark-viewer.html\n');
  console.log('Press Ctrl+C to stop the server\n');
  
  try {
    await runCommand('python3', ['-m', 'http.server', '8000']);
  } catch (error) {
    console.log('\n❌ Error starting server:', error.message);
  }
}

async function listResults() {
  const resultsDir = path.join(__dirname, '..', 'test-results');
  
  if (!fs.existsSync(resultsDir)) {
    console.log('\n⚠️  No results directory found.');
    await question('\nPress Enter to continue...');
    return;
  }
  
  const files = fs.readdirSync(resultsDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.log('\n📁 No result files found.');
  } else {
    console.log('\n📁 Result files:\n');
    
    files.forEach((file, i) => {
      const filepath = path.join(resultsDir, file);
      const stats = fs.statSync(filepath);
      const sizeMB = (stats.size / 1024).toFixed(2);
      const date = stats.mtime.toLocaleString();
      
      console.log(`  ${i + 1}. ${file}`);
      console.log(`     Size: ${sizeMB} KB | Modified: ${date}\n`);
    });
  }
  
  await question('Press Enter to continue...');
}

async function editQueries() {
  const inputPath = path.join(__dirname, 'food-search-input.json');
  
  console.log(`\n📝 Input file location: ${inputPath}\n`);
  console.log('Opening in default editor...\n');
  
  const editor = process.env.EDITOR || 'nano';
  
  try {
    await runCommand(editor, [inputPath]);
  } catch (error) {
    console.log('\n⚠️  Could not open editor. Please edit manually:');
    console.log(`   ${inputPath}\n`);
  }
  
  await question('Press Enter to continue...');
}

async function main() {
  let running = true;
  
  while (running) {
    clearScreen();
    printHeader();
    printMenu();
    
    const choice = await question('Enter your choice (1-7): ');
    
    switch (choice.trim()) {
      case '1':
        await runBenchmark('production');
        break;
      case '2':
        await runBenchmark('staging');
        break;
      case '3':
        await compareResults();
        break;
      case '4':
        await viewResults();
        break;
      case '5':
        await listResults();
        break;
      case '6':
        await editQueries();
        break;
      case '7':
        console.log('\n👋 Goodbye!\n');
        running = false;
        break;
      default:
        console.log('\n❌ Invalid choice. Please select 1-7.');
        await question('Press Enter to continue...');
    }
  }
  
  rl.close();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    rl.close();
    process.exit(1);
  });
}

