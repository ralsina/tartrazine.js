#!/usr/bin/env node
/**
 * Run all imported tartrazine tests
 *
 * This script runs all test files in test/fixtures/ and compares
 * the output against the expected JSON baselines.
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { Lexer } from '../src/lexer.js';

const fixturesDir = 'test/fixtures';
const lexerDirs = readdirSync(fixturesDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

let totalPassed = 0;
let totalFailed = 0;
const failedTests = [];

console.log('Running all tests...\n');

for (const lexerName of lexerDirs) {
  const testDir = `${fixturesDir}/${lexerName}`;
  const testFiles = readdirSync(testDir).filter(f => f.endsWith('.sh')).sort();

  if (testFiles.length === 0) continue;

  let passed = 0, failed = 0;

  for (const testFile of testFiles) {
    const testName = testFile.replace('.sh', '');
    const jsonFile = testName + '.json';
    const jsonPath = `${testDir}/${jsonFile}`;

    if (!existsSync(jsonPath)) continue;

    try {
      const code = readFileSync(`${testDir}/${testFile}`, 'utf-8');
      const expected = JSON.parse(readFileSync(jsonPath, 'utf-8'));

      // Add timeout to prevent infinite loops
      const lexer = new Lexer(lexerName);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout after 5 seconds')), 5000)
      );

      const result = await Promise.race([
        lexer.tokenize(code),
        timeoutPromise
      ]);

      const match = JSON.stringify(result) === JSON.stringify(expected);

      if (match) {
        passed++;
      } else {
        failed++;
        failedTests.push({ lexer: lexerName, test: testName });
      }
    } catch (error) {
      failed++;
      failedTests.push({ lexer: lexerName, test: testName, error: error.message });
    }
  }

  if (passed > 0 || failed > 0) {
    const total = passed + failed;
    const percentage = ((passed / total) * 100).toFixed(0);
    console.log(`${lexerName.padEnd(20)} ${passed}/${total} (${percentage}%)`);
    totalPassed += passed;
    totalFailed += failed;
  }
}

console.log(`\n${'='.repeat(50)}`);
const total = totalPassed + totalFailed;
const percentage = ((totalPassed / total) * 100).toFixed(1);
console.log(`Total: ${totalPassed}/${total} tests passed (${percentage}%)`);
console.log(`${'='.repeat(50)}`);

if (failedTests.length > 0 && failedTests.length <= 20) {
  console.log('\nFailed tests:');
  for (const test of failedTests) {
    console.log(`  - ${test.lexer}/${test.test}` + (test.error ? ` (${test.error})` : ''));
  }
}

process.exit(totalFailed > 0 ? 1 : 0);
