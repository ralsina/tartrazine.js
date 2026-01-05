#!/usr/bin/env node
import { readFileSync, readdirSync } from 'fs';
import { Lexer } from './src/lexer.js';

const testDir = 'test/fixtures/c';
const testFiles = readdirSync(testDir).filter(f => f.endsWith('.sh')).sort();

let passed = 0;
let failed = 0;

for (const testFile of testFiles) {
  const testName = testFile.replace('.sh', '');

  try {
    const code = readFileSync(`${testDir}/${testFile}`, 'utf-8');
    const expected = JSON.parse(readFileSync(`${testDir}/${testName}.json`, 'utf-8'));

    const lexer = new Lexer('c');
    const result = await lexer.tokenize(code);

    if (JSON.stringify(result) === JSON.stringify(expected)) {
      console.log(`✅ ${testName}`);
      passed++;
    } else {
      console.log(`❌ ${testName}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${testName}: ${error.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);

process.exit(failed > 0 ? 1 : 0);
