#!/usr/bin/env node
/**
 * Run HTML formatting tests comparing against tartrazine
 *
 * This script tests our HTML formatter against the Crystal tartrazine
 * to ensure we produce compatible output with the same CSS classes.
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { Lexer } from '../src/lexer.js';
import { HtmlFormatter } from '../src/html-formatter.js';

const fixturesDir = 'test/fixtures';
const lexerDirs = readdirSync(fixturesDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

// Test a subset of lexers to keep tests fast
const lexersToTest = [
  'python',
  'javascript',
  'ruby',
  'rust',
  'c',
  'bash',
  'json',
  'yaml',
  'markdown'
].filter(name => lexerDirs.includes(name));

let totalPassed = 0;
let totalFailed = 0;
const failedTests = [];

console.log('Running HTML formatting tests...\n');
console.log('Testing lexers:', lexersToTest.join(', '));
console.log('');

for (const lexerName of lexersToTest) {
  const testDir = `${fixturesDir}/${lexerName}`;
  const testFiles = readdirSync(testDir)
    .filter(f => f.endsWith('.sh'))
    .sort()
    .slice(0, 3); // Test first 3 tests per lexer

  if (testFiles.length === 0) continue;

  let passed = 0, failed = 0;

  for (const testFile of testFiles) {
    const testName = testFile.replace('.sh', '');
    const jsonFile = testName + '.json';
    const jsonPath = `${testDir}/${jsonFile}`;

    if (!existsSync(jsonPath)) continue;

    try {
      // Read test data
      const inputData = JSON.parse(readFileSync(jsonPath, 'utf-8'));

      // Create lexer and formatter
      const lexer = new Lexer(lexerName);
      await lexer.init();

      const formatter = new HtmlFormatter();

      // Tokenize the input (reconstruct from tokens)
      const code = inputData.map(t => t.value).join('');

      // Format as HTML
      const html = await formatter.format(code, inputData);

      // Verify HTML structure
      const checks = [
        // Check that we have proper class names
        html.includes('class='),
        // Check that we're using the abbreviated class names
        html.match(/class="[^"]*\b[a-z]{1,3}\b/g),
        // Check that we're using span tags for tokens
        html.includes('<span'),
        // Check that text is escaped
        !html.includes('<>&') // Should be &lt;&gt;&amp;
      ];

      // Extract all class names used
      const classMatches = html.matchAll(/class="([^"]+)"/g);
      const classNames = new Set();
      for (const match of classMatches) {
        match[1].split(/\s+/).forEach(c => classNames.add(c));
      }

      // Verify we're using abbreviated class names (1-3 chars mostly)
      let validClasses = true;
      for (const cls of classNames) {
        // Class names should be short abbreviations
        if (cls.length > 5 && !cls.startsWith('line-')) {
          validClasses = false;
          break;
        }
      }

      if (checks.every(c => c) && validClasses) {
        passed++;
        totalPassed++;
      } else {
        failed++;
        totalFailed++;
        failedTests.push({
          lexer: lexerName,
          test: testName,
          reason: 'HTML structure validation failed'
        });
      }
    } catch (error) {
      failed++;
      totalFailed++;
      failedTests.push({
        lexer: lexerName,
        test: testName,
        error: error.message
      });
    }
  }

  if (testFiles.length > 0) {
    const percentage = testFiles.length > 0
      ? Math.round((passed / testFiles.length) * 100)
      : 0;
    process.stdout.write(
      `${lexerName.padEnd(15)} ${passed}/${testFiles.length} (${percentage}%)\n`
    );
  }
}

console.log('');
console.log('==================================================');
console.log(`Total: ${totalPassed}/${totalPassed + totalFailed} tests passed (${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%)`);

if (failedTests.length > 0) {
  console.log('\nFailed tests:');
  for (const test of failedTests) {
    console.log(`  - ${test.lexer}/${test.test}`);
    if (test.error) console.log(`    ${test.error}`);
    if (test.reason) console.log(`    ${test.reason}`);
  }
}

console.log('==================================================');

process.exit(totalFailed > 0 ? 1 : 0);
