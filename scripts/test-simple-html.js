#!/usr/bin/env node
import { readFileSync } from 'fs';
import { Lexer } from '../src/lexer.js';
import { HtmlFormatter } from '../src/html-formatter.js';

const code = readFileSync('test/fixtures/python/test_floats.sh', 'utf-8');

const lexer = new Lexer('python');
await lexer.init();
const tokens = await lexer.tokenize(code);

const formatter = new HtmlFormatter();
const html = await formatter.format(code, tokens);

console.log(html);
