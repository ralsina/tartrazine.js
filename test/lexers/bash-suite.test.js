import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { Lexer } from '../../src/lexer.js';

/**
 * Parse a tartrazine test file
 * Format:
 *   ---input---
 *   <code>
 *   ---tokens---
 *   '<value>'     <Type.Name>
 */
function parseTestFile(content) {
  const parts = content.split('---tokens---');
  if (parts.length !== 2) {
    throw new Error('Invalid test file format');
  }

  // Extract input
  const inputMatch = parts[0].match(/---input---\n([\s\S]*)/);
  const input = inputMatch ? inputMatch[1] : '';

  // Parse tokens
  const tokenLines = parts[1].trim().split('\n');
  const expectedTokens = [];

  for (const line of tokenLines) {
    if (!line.trim() || line.startsWith('#')) continue;

    // Parse: 'value'     Type.Name
    const match = line.match(/^'([^']*)'\s+(\S+(?:\s+\S+)*)$/);
    if (match) {
      const [, value, typePath] = match;
      // Convert Type.Name to TypeName (e.g., Name.Variable -> NameVariable)
      const typeName = typePath.replace(/\./g, '');
      expectedTokens.push({ type: typeName, value });
    }
  }

  return { input, expectedTokens };
}

// Get all bash test files
const testDir = 'test/fixtures/bash';
const testFiles = readdirSync(testDir)
  .filter(f => f.endsWith('.txt'))
  .sort();

describe('Bash Lexer - Full Tartrazine Test Suite', () => {
  for (const testFile of testFiles) {
    const testName = testFile.replace('.txt', '');

    it(`should tokenize ${testName} matching tartrazine baseline`, async () => {
      // Read and parse test file
      const testContent = readFileSync(`${testDir}/${testFile}`, 'utf-8');
      const { input, expectedTokens } = parseTestFile(testContent);

      // Tokenize
      const lexer = new Lexer('bash');
      const result = await lexer.tokenize(input);

      // Compare
      expect(result).toEqual(expectedTokens);
    });
  }
});
