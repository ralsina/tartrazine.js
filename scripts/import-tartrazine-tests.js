#!/usr/bin/env node
/**
 * Import test files from tartrazine test suite
 *
 * This script extracts the input section from tartrazine test files
 * and generates JSON baselines using the tartrazine binary.
 *
 * Usage: node scripts/import-tartrazine-tests.js [lexer_name|all]
 *
 * Examples:
 *   node scripts/import-tartrazine-tests.js bash
 *   node scripts/import-tartrazine-tests.js all
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

function extractInputSection(testContent) {
  // Extract content between ---input--- and ---tokens---
  const match = testContent.match(/---input---\n([\s\S]*?)\n---tokens---/);
  if (!match) {
    throw new Error('Invalid test format: no ---input--- or ---tokens--- markers found');
  }

  // Remove trailing blank lines
  return match[1].trim();
}

function generateBaseline(input, lexerName) {
  const tartrazinePath = 'vendor/tartrazine/bin/tartrazine';

  try {
    // Create temp file with input
    const tempInput = '/tmp/tartrazine-test-input.txt';
    writeFileSync(tempInput, input);

    // Run tartrazine
    const json = execSync(
      `${tartrazinePath} -f json -l ${lexerName} ${tempInput}`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
    );

    return JSON.parse(json);
  } catch (error) {
    throw new Error(`Failed to generate baseline: ${error.message}`);
  }
}

function importTests(lexerName) {
  const sourceDir = `vendor/tartrazine/spec/tests/${lexerName}`;
  const targetDir = `test/fixtures/${lexerName}`;

  // Check if source directory exists
  if (!existsSync(sourceDir)) {
    return { imported: 0, failed: 0, skipped: 0, exists: false };
  }

  // Create target directory if needed
  try {
    mkdirSync(targetDir, { recursive: true });
  } catch {
    // Directory already exists
  }

  // Process all test files
  const testFiles = readdirSync(sourceDir).filter(f => f.endsWith('.txt'));

  if (testFiles.length === 0) {
    return { imported: 0, failed: 0, skipped: 0, exists: true, tests: 0 };
  }

  console.log(`\n📦 Importing ${lexerName} tests`);
  console.log(`   Found ${testFiles.length} test files`);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const testFile of testFiles) {
    const testName = testFile.replace('.txt', '');
    const sourcePath = `${sourceDir}/${testFile}`;
    const targetSh = `${targetDir}/${testName}.sh`;
    const targetJson = `${targetDir}/${testName}.json`;

    try {
      // Read test file
      const testContent = readFileSync(sourcePath, 'utf-8');

      // Extract input section
      const input = extractInputSection(testContent);

      // Save input as .sh file
      writeFileSync(targetSh, input);

      // Generate baseline
      const baseline = generateBaseline(input, lexerName);
      writeFileSync(targetJson, JSON.stringify(baseline, null, 2));

      imported++;
    } catch (error) {
      failed++;
      console.log(`  ❌ ${testName}: ${error.message}`);
    }
  }

  console.log(`   ✅ ${imported} imported, ${skipped} skipped, ${failed} failed`);

  return { imported, failed, skipped, exists: true, tests: testFiles.length };
}

function importAllTests() {
  const testsRoot = 'vendor/tartrazine/spec/tests';

  if (!existsSync(testsRoot)) {
    console.error('❌ Tests directory not found');
    console.error(`   Expected: ${testsRoot}`);
    process.exit(1);
  }

  console.log('🔍 Discovering all test directories...');

  // Get all subdirectories in the tests directory
  const lexerDirs = readdirSync(testsRoot, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort();

  console.log(`   Found ${lexerDirs.length} test directories\n`);

  let totalImported = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let withTests = 0;

  for (const lexerName of lexerDirs) {
    const result = importTests(lexerName);

    if (!result.exists) {
      console.log(`   ⚠️  ${lexerName}: directory not found`);
      continue;
    }

    if (result.tests === 0) {
      console.log(`   ⏭️  ${lexerName}: no test files`);
      continue;
    }

    withTests++;
    totalImported += result.imported;
    totalFailed += result.failed;
    totalSkipped += result.skipped;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Overall Results:');
  console.log(`   Lexers with tests: ${withTests}/${lexerDirs.length}`);
  console.log(`   Total imported: ${totalImported}`);
  console.log(`   Total skipped: ${totalSkipped}`);
  console.log(`   Total failed: ${totalFailed}`);
  console.log('='.repeat(60));

  if (totalFailed > 0) {
    process.exit(1);
  }
}

// Parse command line arguments
const lexerName = process.argv[2];

if (!lexerName) {
  console.error('Usage: node scripts/import-tartrazine-tests.js [lexer_name|all]');
  console.error('\nExamples:');
  console.error('  node scripts/import-tartrazine-tests.js bash');
  console.error('  node scripts/import-tartrazine-tests.js all');
  process.exit(1);
}

// Check if tartrazine binary exists
try {
  execSync('test -x vendor/tartrazine/bin/tartrazine');
} catch {
  console.error('❌ tartrazine binary not found');
  console.error('   Please build tartrazine first:');
  console.error('   cd vendor/tartrazine && shards build');
  process.exit(1);
}

// Import tests
if (lexerName === 'all') {
  importAllTests();
  console.log('\n✨ All tests imported successfully!');
} else {
  const result = importTests(lexerName);

  if (!result.exists) {
    console.error(`❌ No tests found for lexer: ${lexerName}`);
    console.error(`   Expected directory: vendor/tartrazine/spec/tests/${lexerName}`);
    process.exit(1);
  }

  if (result.tests === 0) {
    console.log(`\n⚠️  No test files found for ${lexerName}`);
  } else {
    console.log(`\n✨ Done! Imported ${result.imported} tests for ${lexerName}`);
  }
}
