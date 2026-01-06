/**
 * Simple API for syntax highlighting
 * One function to rule them all!
 */

import { Lexer } from './lexer.js';
import { HtmlFormatter } from './html-formatter.js';
import { loadLexer } from './lexer-loader.js';

// Cache for reuse
const lexerCache = new Map();

/**
 * Simple syntax highlighting function
 * @param {string} code - The source code to highlight
 * @param {string} language - The lexer/language name (e.g., 'javascript', 'python')
 * @param {object} options - Optional configuration
 * @returns {Promise<string>} HTML string with syntax highlighting
 */
export async function highlight(code, language, options = {}) {
  try {
    // Get or create lexer
    if (!lexerCache.has(language)) {
      const lexerDef = await loadLexer(language);
      const lexer = new Lexer(language);
      await lexer.init();
      lexerCache.set(language, lexer);
    }

    const lexer = lexerCache.get(language);

    // Tokenize the code
    const tokens = await lexer.tokenize(code);

    // Format to HTML
    const formatter = new HtmlFormatter({
      standalone: options.standalone || false,
      lineNumbers: options.lineNumbers || false,
      ...options
    });

    return formatter.format(code, tokens);
  } catch (error) {
    // Return escaped code as fallback
    console.error(`Highlighting error for ${language}:`, error);
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  }
}

/**
 * Clear the lexer cache
 * Useful for freeing memory or forcing reloads
 */
export function clearCache() {
  lexerCache.clear();
}

/**
 * Set a custom base URL for loading lexers
 * @param {string} baseUrl - The base URL (e.g., 'https://cdn.example.com/tartrazine')
 */
export function setAssetBase(baseUrl) {
  // This will be used by the lexer loader
  if (typeof window !== 'undefined') {
    window.__tartrazine_asset_base = baseUrl;
  }
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
