// Import browser-compatible loaders
import { loadLexer } from './lexer-loader.js';
import { loadTheme } from './theme-loader.js';

// Import core modules from src
import { StateMatcher } from './src/state-matcher.js';
import { getTokenAbbreviation } from './src/token-abbreviations.js';

// Example code snippets
const examples = {
  javascript: `function greet(name) {
  // Greet the user
  console.log(\`Hello, \${name}!\`);
  return true;
}

class Greeter {
  constructor(name) {
    this.name = name;
  }

  sayHello() {
    console.log(\`Hi, \${this.name}!\`);
  }
}

// Arrow functions and modern syntax
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled);`,

  python: `#!/usr/bin/env python3
"""A simple Python example"""

def greet(name):
    # Greet the user
    print(f"Hello, {name}!")
    return True

class Greeter:
    """A greeter class"""
    def __init__(self, name):
        self.name = name

    def say_hello(self):
        print(f"Hi, {self.name}!")

if __name__ == "__main__":
    greet("World")
    greeter = Greeter("Python")
    greeter.say_hello()`,

  rust: `fn main() {
    // Simple greeting
    let name = "World";
    println!("Hello, {}!", name);

    // Struct example
    struct Greeter {
        name: String,
    }

    impl Greeter {
        fn new(name: &str) -> Self {
            Greeter {
                name: name.to_string(),
            }
        }

        fn say_hello(&self) {
            println!("Hi, {}!", self.name);
        }
    }

    let greeter = Greeter::new("Rust");
    greeter.say_hello();
}`,
};

// State
const state = {
  currentLexer: null,
  currentTheme: null,
  lexerDef: null,
  theme: null,
  debounceTimer: null,
};

// DOM elements
const elements = {
  languageSelect: null,
  themeSelect: null,
  input: null,
  output: null,
  stats: null,
};

// Initialize
async function init() {
  // Get DOM elements
  elements.languageSelect = document.getElementById('language-select');
  elements.themeSelect = document.getElementById('theme-select');
  elements.input = document.getElementById('input');
  elements.output = document.getElementById('output');
  elements.stats = document.getElementById('stats');

  // Load default example
  elements.input.value = examples.javascript;

  // Set initial state
  state.currentLexer = 'javascript';
  state.currentTheme = 'github-dark';

  // Load lexer and theme
  await loadCurrentLexer();
  await loadCurrentTheme();

  // Set up event listeners
  elements.languageSelect.addEventListener('change', handleLanguageChange);
  elements.themeSelect.addEventListener('change', handleThemeChange);
  elements.input.addEventListener('input', handleInputChange);

  // Initial highlight
  await updateOutput();
}

// Load current lexer
async function loadCurrentLexer() {
  try {
    showLoading();
    state.lexerDef = await loadLexer(state.currentLexer);
    console.log(`Loaded lexer: ${state.currentLexer}`);
  } catch (error) {
    showError(`Failed to load lexer "${state.currentLexer}": ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Load current theme
async function loadCurrentTheme() {
  try {
    state.theme = await loadTheme(state.currentTheme);
    console.log(`Loaded theme: ${state.currentTheme}`);
  } catch (error) {
    showError(`Failed to load theme "${state.currentTheme}": ${error.message}`);
    // Fall back to github-dark
    if (state.currentTheme !== 'github-dark') {
      state.currentTheme = 'github-dark';
      state.theme = await loadTheme('github-dark');
    }
  }
}

// Handle language change
async function handleLanguageChange(event) {
  state.currentLexer = event.target.value;

  // Load example if available
  if (examples[state.currentLexer]) {
    elements.input.value = examples[state.currentLexer];
  }

  await loadCurrentLexer();
  await updateOutput();
}

// Handle theme change
async function handleThemeChange(event) {
  state.currentTheme = event.target.value;
  await loadCurrentTheme();
  await updateOutput();
}

// Handle input change (debounced)
function handleInputChange() {
  // Update stats
  const text = elements.input.value;
  const charCount = text.length;
  const lineCount = text.split('\n').length;
  elements.stats.textContent = `Characters: ${charCount} | Lines: ${lineCount}`;

  // Debounce the highlight
  clearTimeout(state.debounceTimer);
  state.debounceTimer = setTimeout(() => {
    updateOutput();
  }, 300);
}

// Update output panel
async function updateOutput() {
  if (!state.lexerDef || !state.theme) {
    return;
  }

  const code = elements.input.value;

  if (!code.trim()) {
    elements.output.innerHTML = '';
    return;
  }

  try {
    // Tokenize
    const matcher = new StateMatcher(state.lexerDef);
    const tokens = [];
    for await (const token of matcher.tokenize(code, 'root')) {
      tokens.push(token);
    }
    const collapsedTokens = matcher.collapseTokens(tokens);

    // Generate HTML
    const html = formatTokens(code, collapsedTokens);
    elements.output.innerHTML = html;
  } catch (error) {
    showError(`Highlighting error: ${error.message}`);
  }
}

// Format tokens to HTML
function formatTokens(code, tokens) {
  let output = '<pre><code>';

  for (const token of tokens) {
    const escapedValue = escapeHtml(token.value);
    const className = getCssClass(token.type);
    output += `<span class="${className}">${escapedValue}</span>`;
  }

  output += '</code></pre>';
  return output;
}

// Get CSS class for token type
function getCssClass(tokenType) {
  // Use style inheritance
  if (!state.theme.styles[tokenType]) {
    const parents = state.theme.styleParents[tokenType] || [];
    for (const parent of parents) {
      if (state.theme.styles[parent]) {
        state.theme.styles[tokenType] = state.theme.styles[parent];
        break;
      }
    }
  }

  const abbrev = getTokenAbbreviation(tokenType);
  return abbrev;
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show loading state
function showLoading() {
  elements.output.classList.add('loading');
}

// Hide loading state
function hideLoading() {
  elements.output.classList.remove('loading');
}

// Show error message
function showError(message) {
  elements.output.innerHTML = `<div class="error-message">${message}</div>`;
}

// Start the app
init();
