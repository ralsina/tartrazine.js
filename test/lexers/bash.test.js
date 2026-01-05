import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { Lexer } from '../src/lexer.js';

describe('Bash Lexer', () => {
  it('should tokenize bash script matching Crystal tartrazine baseline', async () => {
    // Read test input
    const code = readFileSync('test/fixtures/bash/simple.sh', 'utf-8');
    const expected = JSON.parse(readFileSync('test/fixtures/bash/simple.json', 'utf-8'));

    // Create lexer and tokenize
    const lexer = new Lexer('bash');
    const result = await lexer.tokenize(code);

    // Compare with baseline
    expect(result).toEqual(expected);
  });
});
