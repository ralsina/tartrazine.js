#!/usr/bin/env node
import { readdirSync, readFileSync, existsSync } from 'fs';
import { Lexer } from './src/lexer.js';
import { readFileSync as readFileSyncSync } from 'fs';

// Load skip list
const skipConfig = JSON.parse(readFileSyncSync('test-skip-list.json', 'utf-8'));
const skipTests = new Set(skipConfig.skip_tests.tests);
const skippedTests = [];

const fixturesDir = 'test/fixtures';
const lexerDirs = readdirSync(fixturesDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

let totalPassed = 0;
let totalFailed = 0;
const failedTests = [];

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

    // Check if test is in skip list
    const testKey = `${lexerName}/${testName}`;
    if (skipTests.has(testKey)) {
      console.log(`  ⊘ SKIP ${lexerName}/${testName} (known regex engine limitation)`);
      skippedTests.push(testKey);
      continue;
    }

    console.log(`  Testing ${lexerName}/${testName}...`);

    try {
      const code = readFileSync(`${testDir}/${testFile}`, 'utf-8');
      const expected = JSON.parse(readFileSync(jsonPath, 'utf-8'));

      const lexer = new Lexer(lexerName);
      const result = await lexer.tokenize(code);

      const match = JSON.stringify(result) === JSON.stringify(expected);

      if (match) {
        console.log(`    ✓ PASS`);
        passed++;
      } else {
        console.log(`    ✗ FAIL`);
        failed++;
        failedTests.push({ lexer: lexerName, test: testName });
      }
    } catch (error) {
      console.log(`    ✗ ERROR: ${error.message}`);
      failed++;
      failedTests.push({ lexer: lexerName, test: testName, error: error.message });
    }
  }

  if (passed > 0 || failed > 0) {
    console.log(`${lexerName}: ${passed} passed, ${failed} failed`);
    totalPassed += passed;
    totalFailed += failed;
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);
if (skippedTests.length > 0) {
  console.log(`Skipped: ${skippedTests.length} tests (known regex engine limitations)`);
}
console.log(`Success rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
console.log(`${'='.repeat(60)}`);
if (skippedTests.length > 0) {
  console.log(`\nSkipped tests:`);
  for (const test of skippedTests) {
    console.log(`  - ${test}`);
  }
}
