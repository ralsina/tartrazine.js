#!/usr/bin/env node
/**
 * Compare HTML output with tartrazine (Crystal version)
 *
 * This script runs the same code through both our JavaScript version
 * and the Crystal tartrazine binary, then compares the HTML output
 * to ensure CSS classes match.
 */

import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { highlight } from '../src/highlight.js';

const fixturesDir = 'test/fixtures';

// Test a small subset for detailed comparison
const testsToRun = [
  { lexer: 'python', file: 'test_floats' },
  { lexer: 'python', file: 'test_walrus_operator' },
  { lexer: 'javascript', file: 'test_arrow_functions' },
  { lexer: 'bash', file: 'test_variables' },
  { lexer: 'json', file: 'test_object' }
];

let totalPassed = 0;
let totalFailed = 0;
const comparisons = [];

console.log('Comparing HTML output with tartrazine...\n');

for (const test of testsToRun) {
  const { lexer, file } = test;
  const testDir = `${fixturesDir}/${lexer}`;
  const jsonPath = `${testDir}/${file}.json`;
  const shPath = `${testDir}/${file}.sh`;

  if (!existsSync(jsonPath) || !existsSync(shPath)) {
    console.log(`SKIP ${lexer}/${file} - files not found`);
    continue;
  }

  try {
    // Read the source code
    const sourceCode = readFileSync(shPath, 'utf-8');

    // Get our output
    const ourHtml = await highlight(sourceCode, lexer, {
      standalone: false,
      lineNumbers: false
    });

    // Get tartrazine's output (to temp file)
    const tempFile = join(tmpdir(), `tartrazine-test-${Date.now()}.html`);
    try {
      execSync(
        `tartrazine ${shPath} -f html -l ${lexer} 2>/dev/null > ${tempFile}`,
        { stdio: 'pipe' }
      );
      const theirHtml = readFileSync(tempFile, 'utf-8');

      // Compare CSS class usage (only token classes, not structural)
      const ourClasses = extractClasses(ourHtml);
      const theirClasses = extractClasses(theirHtml);

      // Filter out structural classes like 'b' (Background)
      const tokenClasses = (classes) => classes.filter(c =>
        c !== 'b' && !c.startsWith('line-') && c !== 'ln' && c !== 'lnt'
      );

      const ourTokenClasses = tokenClasses(ourClasses);
      const theirTokenClasses = tokenClasses(theirClasses);

      // Check if classes match
      const ourClassSet = new Set(ourTokenClasses);
      const theirClassSet = new Set(theirTokenClasses);

      // Calculate differences
      const missing = [...theirClassSet].filter(c => !ourClassSet.has(c));
      const extra = [...ourClassSet].filter(c => !theirClassSet.has(c));

      const match = missing.length === 0 && extra.length === 0;

      // Debug output
      if (!match) {
        console.log(`  Our token classes:   ${[...ourClassSet].join(', ')}`);
        console.log(`  Their token classes: ${[...theirClassSet].join(', ')}`);
      }

      if (match) {
        totalPassed++;
        console.log(`✓ ${lexer}/${file}`);
        comparisons.push({ lexer, file, status: 'pass' });
      } else {
        totalFailed++;
        console.log(`✗ ${lexer}/${file}`);
        console.log(`  Missing classes: ${missing.join(', ') || 'none'}`);
        console.log(`  Extra classes: ${extra.join(', ') || 'none'}`);
        comparisons.push({
          lexer,
          file,
          status: 'fail',
          missing,
          extra
        });
      }
    } finally {
      // Clean up temp file
      if (existsSync(tempFile)) {
        unlinkSync(tempFile);
      }
    }
  } catch (error) {
    totalFailed++;
    console.log(`✗ ${lexer}/${file} - ${error.message}`);
    comparisons.push({
      lexer,
      file,
      status: 'error',
      error: error.message
    });
  }
}

console.log('');
console.log('==================================================');
console.log(`Total: ${totalPassed}/${totalPassed + totalFailed} tests passed`);
console.log('==================================================');

// Show detailed comparison if failures
if (totalFailed > 0) {
  console.log('\nDetailed comparison:');
  for (const comp of comparisons) {
    if (comp.status !== 'pass') {
      console.log(`\n${comp.lexer}/${comp.file}:`);
      if (comp.missing?.length) console.log('  We are missing these CSS classes:', comp.missing.join(', '));
      if (comp.extra?.length) console.log('  We have these extra CSS classes:', comp.extra.join(', '));
      if (comp.error) console.log('  Error:', comp.error);
    }
  }
}

process.exit(totalFailed > 0 ? 1 : 0);

/**
 * Extract all CSS class names from HTML
 */
function extractClasses(html) {
  const matches = html.matchAll(/class="([^"]+)"/g);
  const classes = [];
  for (const match of matches) {
    const classList = match[1].split(/\s+/);
    classes.push(...classList);
  }
  return [...new Set(classes)].sort();
}
