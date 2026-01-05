import { RegexEngine } from './regex-engine.js';

/**
 * State Matcher - Core tokenization engine
 * Implements the state machine that matches patterns and executes actions
 */
export class StateMatcher {
  constructor(lexerDef) {
    this.lexerDef = lexerDef;
    this.regexEngine = new RegexEngine();
    this.compiledRules = new Map();
  }

  /**
   * Tokenize text starting from a given state
   * @param {string} text - Text to tokenize
   * @param {string} initialState - Starting state name
   * @returns {Array} Array of tokens
   */
  tokenize(text, initialState = 'root') {
    const tokens = [];
    const stateStack = [initialState];
    let position = 0;

    while (position < text.length) {
      const currentState = stateStack[stateStack.length - 1];
      const stateDef = this.lexerDef.states[currentState];

      if (!stateDef) {
        // No matching state - advance one character
        position++;
        continue;
      }

      // Try to match a rule
      const matchResult = this.findMatch(stateDef, text, position);

      if (!matchResult) {
        // No match - advance one character as unmatched text
        tokens.push({
          type: 'Text',
          value: text[position],
          position,
        });
        position++;
        continue;
      }

      // Execute actions for the matched rule
      const { match, rule } = matchResult;

      for (const action of rule.actions) {
        this.executeAction(action, match, stateStack, tokens, position);
      }

      position += match[0].length;
    }

    return tokens;
  }

  /**
   * Find a matching rule at the current position
   * @param {Object} stateDef - State definition
   * @param {string} text - Text to search
   * @param {number} position - Current position
   * @returns {Object|null} Match result or null
   */
  findMatch(stateDef, text, position) {
    const rules = this.getCompiledRules(stateDef.name);

    for (const rule of rules) {
      const regex = rule.regex;
      const match = this.regexEngine.match(regex, text, position);

      if (match && match.index === position) {
        return { match, rule };
      }
    }

    return null;
  }

  /**
   * Get or compile rules for a state
   * @param {string} stateName - State name
   * @returns {Array} Compiled rules
   */
  getCompiledRules(stateName) {
    if (this.compiledRules.has(stateName)) {
      return this.compiledRules.get(stateName);
    }

    const stateDef = this.lexerDef.states[stateName];
    if (!stateDef) {
      return [];
    }

    const compiled = stateDef.rules.map((rule) => ({
      regex: this.regexEngine.compile(rule.pattern),
      actions: rule.actions,
    }));

    this.compiledRules.set(stateName, compiled);
    return compiled;
  }

  /**
   * Execute an action
   * @param {Object} action - Action definition
   * @param {Array} match - Regex match result
   * @param {Array} stateStack - State stack
   * @param {Array} tokens - Token array
   * @param {number} position - Current position
   */
  executeAction(action, match, stateStack, tokens, position) {
    switch (action.type) {
      case 'token':
        tokens.push({
          type: action.tokenType,
          value: match[0],
          position,
        });
        break;

      case 'push':
        // Phase 2: Implement push
        console.warn('Push action not yet implemented');
        break;

      case 'pop':
        // Phase 2: Implement pop
        console.warn('Pop action not yet implemented');
        break;

      case 'include':
        // Phase 2: Implement include
        console.warn('Include action not yet implemented');
        break;

      default:
        console.warn('Unknown action type:', action.type);
    }
  }
}
