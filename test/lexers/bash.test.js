import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { Lexer } from '../../src/lexer.js';

// Get all bash test files
const testDir = 'test/fixtures/bash';
const testFiles = readdirSync(testDir).filter(f => f.endsWith('.sh')).sort();

describe('Bash Lexer - Full Tartrazine Test Suite', () => {
  for (const testFile of testFiles) {
    const testName = testFile.replace('.sh', '');
    const jsonFile = testName + '.json';

    it(`tokenizes ${testName} matching tartrazine baseline`, async () => {
      // Read test input
      const code = readFileSync(`${testDir}/${testFile}`, 'utf-8');
      const expected = JSON.parse(readFileSync(`${testDir}/${jsonFile}`, 'utf-8'));

      // Create lexer and tokenize
      const lexer = new Lexer('bash');
      const result = await lexer.tokenize(code);

      // Compare with baseline
      expect(result).toEqual(expected);
    });
  }
});
