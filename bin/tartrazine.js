#!/usr/bin/env node
/**
 * Tartrazine.js CLI
 * Syntax highlighting tool
 */

import { readFileSync } from 'fs';
import { Lexer } from '../src/lexer.js';
import { HtmlFormatter } from '../src/html-formatter.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
tartrazine.js: Syntax highlighting tool

Usage:
  tartrazine.js <file> -f html [options]

Options:
  -f <format>       Output format (only html is supported for now)
  -t <theme>        Theme name (default: github-dark)
  -l <lexer>        Lexer/language name (default: autodetect)
  -o <output>       Output file (default: stdout)
  --line-numbers    Show line numbers
  --standalone       Output full HTML document with CSS
  --wrap             Wrap long lines

Examples:
  tartrazine.js example.js -f html --standalone
  tartrazine.js script.py -f html -t monokai --line-numbers
    `);
    process.exit(0);
  }

  // Parse arguments
  let filename = null;
  let format = null;
  let theme = 'github-dark';
  let lexer = null;
  let outputFile = null;
  let lineNumbers = false;
  let standalone = false;
  let wrapLongLines = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '-f') {
      format = nextArg;
      i++;
    } else if (arg === '-t') {
      theme = nextArg;
      i++;
    } else if (arg === '-l') {
      lexer = nextArg;
      i++;
    } else if (arg === '-o') {
      outputFile = nextArg;
      i++;
    } else if (arg === '--line-numbers') {
      lineNumbers = true;
    } else if (arg === '--standalone') {
      standalone = true;
    } else if (arg === '--wrap') {
      wrapLongLines = true;
    } else if (!arg.startsWith('-')) {
      filename = arg;
    }
  }

  if (!filename) {
    console.error('Error: No input file specified');
    console.error('Usage: tartrazine.js <file> -f html [options]');
    process.exit(1);
  }

  if (!format) {
    console.error('Error: No format specified (use -f html)');
    process.exit(1);
  }

  if (format !== 'html') {
    console.error(`Error: Format "${format}" not supported (only html is available)`);
    process.exit(1);
  }

  try {
    // Read input file
    const code = readFileSync(filename, 'utf-8');

    // Auto-detect lexer from file extension if not specified
    if (!lexer) {
      const ext = filename.split('.').pop().toLowerCase();
      const commonExtensions = {
        'js': 'javascript',
        'ts': 'typescript',
        'py': 'python',
        'rb': 'ruby',
        'java': 'java',
        'c': 'c',
        'cpp': 'c++',
        'cc': 'c++',
        'cxx': 'c++',
        'h': 'c',
        'hpp': 'c++',
        'cs': 'c#',
        'go': 'go',
        'rs': 'rust',
        'kt': 'kotlin',
        'scala': 'scala',
        'swift': 'swift',
        'php': 'php',
        'sh': 'bash',
        'bash': 'bash',
        'zsh': 'zsh',
        'fish': 'fish',
        'sql': 'sql',
        'xml': 'xml',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'yaml': 'yaml',
        'yml': 'yaml',
        'md': 'markdown',
      };
      lexer = commonExtensions[ext] || 'text';
    }

    // Tokenize
    const lexerInstance = new Lexer(lexer);
    await lexerInstance.init();
    const tokens = await lexerInstance.tokenize(code);

    // Format to HTML
    const formatter = new HtmlFormatter({
      theme,
      lineNumbers,
      standalone,
      wrapLongLines,
    });

    const html = formatter.format(code, tokens);

    // Write output
    if (outputFile) {
      const { writeFileSync } = await import('fs');
      writeFileSync(outputFile, html, 'utf-8');
      console.error(`Formatted ${filename} -> ${outputFile}`);
    } else {
      console.log(html);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
