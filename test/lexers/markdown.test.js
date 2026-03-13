import { describe, it, expect } from 'vitest';
import { Lexer } from '../../src/lexer.js';

describe('Markdown Lexer', () => {
  it('should preserve closing fenced code block backticks with language and trailing newlines', async () => {
    const code = '```python\ndef f()\n```\n\n';
    const lexer = new Lexer('markdown');
    const tokens = await lexer.tokenize(code);

    // Reconstruct the text from tokens
    const reconstructed = tokens.map(t => t.value).join('');

    // The reconstructed text should match the input exactly
    expect(reconstructed).toBe(code);
    expect(reconstructed.length).toBe(code.length);
  });

  it('should preserve closing fenced code block backticks with language, no trailing content', async () => {
    const code = '```python\ndef f()\n```';
    const lexer = new Lexer('markdown');
    const tokens = await lexer.tokenize(code);

    // Reconstruct the text from tokens
    const reconstructed = tokens.map(t => t.value).join('');

    // The reconstructed text should match the input exactly
    expect(reconstructed).toBe(code);
    expect(reconstructed.length).toBe(code.length);
  });

  it('should preserve closing fenced code block backticks without language', async () => {
    const code = '```\ndef f()\n```\n\n';
    const lexer = new Lexer('markdown');
    const tokens = await lexer.tokenize(code);

    // Reconstruct the text from tokens
    const reconstructed = tokens.map(t => t.value).join('');

    // The reconstructed text should match the input exactly
    expect(reconstructed).toBe(code);
    expect(reconstructed.length).toBe(code.length);
  });

  it('should tokenize fenced code block content with the specified language lexer', async () => {
    const code = '```python\ndef f()\n```';
    const lexer = new Lexer('markdown');
    const tokens = await lexer.tokenize(code);

    // Check that we have the expected tokens
    // Should have: opening backticks, language name, newline, python tokens, closing backticks
    expect(tokens.length).toBeGreaterThan(5);

    // First token should be the opening backticks
    expect(tokens[0].type).toBe('LiteralStringBacktick');
    expect(tokens[0].value).toBe('```');

    // Second token should be the language name
    expect(tokens[1].type).toBe('NameLabel');
    expect(tokens[1].value).toBe('python');

    // Third token should be the newline
    expect(tokens[2].type).toBe('TextWhitespace');
    expect(tokens[2].value).toBe('\n');

    // Python tokens should be present (def, function name, etc.)
    const hasKeyword = tokens.some(t => t.type === 'Keyword' && t.value === 'def');
    expect(hasKeyword).toBe(true);

    // Last token should be the closing backticks
    expect(tokens[tokens.length - 1].type).toBe('LiteralStringBacktick');
    expect(tokens[tokens.length - 1].value).toBe('```');
  });
});
