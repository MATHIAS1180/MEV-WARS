#!/usr/bin/env node

/**
 * Lighthouse Performance Test Script
 * Run: node scripts/lighthouse-test.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const URL = process.env.TEST_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '../lighthouse-reports');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = path.join(OUTPUT_DIR, `report-${timestamp}.html`);

console.log('🚀 Running Lighthouse audit...');
console.log(`📍 URL: ${URL}`);
console.log(`📁 Output: ${outputPath}\n`);

const command = `npx lighthouse ${URL} \
  --output=html \
  --output-path="${outputPath}" \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo \
  --throttling-method=simulate \
  --preset=desktop`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Lighthouse failed:', error.message);
    process.exit(1);
  }

  console.log(stdout);
  
  // Parse scores from output
  const scoreRegex = /(\w+):\s+(\d+)/g;
  let match;
  const scores = {};
  
  while ((match = scoreRegex.exec(stdout)) !== null) {
    scores[match[1]] = parseInt(match[2]);
  }

  console.log('\n📊 Lighthouse Scores:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  Object.entries(scores).forEach(([category, score]) => {
    const emoji = score >= 90 ? '✅' : score >= 50 ? '⚠️' : '❌';
    console.log(`${emoji} ${category.padEnd(20)} ${score}/100`);
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📄 Full report: ${outputPath}`);
  
  // Check if all scores are 100
  const allPerfect = Object.values(scores).every(score => score === 100);
  
  if (allPerfect) {
    console.log('\n🎉 Perfect score! All categories at 100!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some categories need improvement');
    process.exit(1);
  }
});
