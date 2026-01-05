import { loadLexer } from './lexer-loader.js';
import { StateMatcher } from './state-matcher.js';

/**
 * Main Lexer class - Public API for tokenizing text
 */
export class Lexer {
  constructor(lexerName) {
    this.lexerName = lexerName;
    this.lexerDef = null;
    this.initialized = false;
  }

  /**
   * Initialize the lexer (lazy loading)
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) {
      return;
    }

    this.lexerDef = await loadLexer(this.lexerName);
    this.initialized = true;
  }

  /**
   * Tokenize text
   * @param {string} text - Text to tokenize
   * @param {Object} options - Options
   * @param {string} options.state - Initial state (auto-detected if not specified)
   * @returns {Promise<Array>} Array of tokens
   */
  async tokenize(text, options = {}) {
    await this.init();

    // Auto-detect initial state if not specified
    let initialState = options.state;
    if (!initialState) {
      // Try common default states in order
      const stateNames = Object.keys(this.lexerDef.states);
      initialState = stateNames.find(s => s === 'root') ||
                      stateNames.find(s => s === 'data') ||
                      stateNames[0];
    }

    const matcher = new StateMatcher(this.lexerDef);
    return matcher.tokenize(text, initialState);
  }

  /**
   * Get lexer metadata
   * @returns {Promise<Object>} Lexer metadata
   */
  async getMetadata() {
    await this.init();
    return {
      name: this.lexerDef.name,
      aliases: this.lexerDef.aliases,
      filenames: this.lexerDef.filenames,
      mimeTypes: this.lexerDef.mimeTypes,
    };
  }
}

/**
 * Convenience function to create and initialize a lexer
 * @param {string} lexerName - Name of the lexer
 * @returns {Promise<Lexer>} Initialized lexer
 */
export async function createLexer(lexerName) {
  const lexer = new Lexer(lexerName);
  await lexer.init();
  return lexer;
}
