#!/usr/bin/env node
import { formatHtml } from './src/html-formatter.js';

const code = `function hello(name) {
  // Greet the user
  console.log("Hello, " + name + "!");
  return true;
}

hello("World");`;

async function test() {
  console.log('Testing HTML formatter...\n');

  // Test 1: Simple inline HTML (no standalone)
  console.log('Test 1: Inline HTML');
  const html1 = await formatHtml(code, 'javascript', {
    standalone: false,
    theme: 'github-dark',
  });
  console.log(html1.substring(0, 200) + '...\n');

  // Test 2: Standalone HTML
  console.log('Test 2: Standalone HTML');
  const html2 = await formatHtml(code, 'javascript', {
    standalone: true,
    theme: 'monokai',
    lineNumbers: true,
  });
  console.log(html2.substring(0, 400) + '...\n');

  console.log('Tests completed!');
}

test().catch(console.error);
