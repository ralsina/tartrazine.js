import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { Lexer } from '../src/lexer.js';

describe('Plaintext Lexer', () => {
  it('should tokenize plain text matching Crystal tartrazine baseline', async () => {
    // Read test input
    const code = readFileSync('test/fixtures/plaintext/simple.txt', 'utf-8');
    const expected = JSON.parse(readFileSync('test/fixtures/plaintext/simple.json', 'utf-8'));

    // Create lexer and tokenize
    const lexer = new Lexer('plaintext');
    const result = await lexer.tokenize(code);

    // Compare with baseline
    expect(result).toEqual(expected);
  });
});
