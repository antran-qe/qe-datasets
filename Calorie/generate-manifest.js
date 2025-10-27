#!/usr/bin/env node

/**
 * Generate manifest.json for GitHub Pages deployment
 * This script scans api-results/baseline and api-results/current directories
 * and creates a manifest.json file listing all JSON files
 */

const fs = require('fs');
const path = require('path');

const API_RESULTS_DIR = path.join(__dirname, 'api-results');
const BASELINE_DIR = path.join(API_RESULTS_DIR, 'baseline');
const CURRENT_DIR = path.join(API_RESULTS_DIR, 'current');
const MANIFEST_PATH = path.join(API_RESULTS_DIR, 'manifest.json');

function getJsonFiles(directory) {
    try {
        if (!fs.existsSync(directory)) {
            console.warn(`⚠️  Directory not found: ${directory}`);
            return [];
        }

        const files = fs.readdirSync(directory);
        return files
            .filter(file => file.endsWith('.json'))
            .sort()
            .reverse(); // Most recent first
    } catch (error) {
        console.error(`Error reading directory ${directory}:`, error.message);
        return [];
    }
}

function generateManifest() {
    console.log('🔍 Scanning for result files...\n');

    const baselineFiles = getJsonFiles(BASELINE_DIR);
    const currentFiles = getJsonFiles(CURRENT_DIR);

    console.log(`✅ Found ${baselineFiles.length} baseline files`);
    console.log(`✅ Found ${currentFiles.length} current files\n`);

    const manifest = {
        generated: new Date().toISOString(),
        baseline: baselineFiles.map(f => `baseline/${f}`),
        current: currentFiles.map(f => `current/${f}`)
    };

    // Write manifest file
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    
    console.log(`📝 Manifest generated: ${MANIFEST_PATH}`);
    console.log('\n📋 Manifest contents:');
    console.log(JSON.stringify(manifest, null, 2));
    console.log('\n✨ Done! You can now deploy to GitHub Pages.');
}

// Run the generator
generateManifest();

