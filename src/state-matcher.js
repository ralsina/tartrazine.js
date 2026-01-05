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
        // No match - advance one character as unmatched text (Error type)
        tokens.push({
          type: 'Error',
          value: text[position],
        });
        position++;
        continue;
      }

      // Execute actions for the matched rule
      const { match, rule } = matchResult;

      for (const action of rule.actions) {
        this.executeAction(action, match, stateStack, tokens, position);
      }

      // Advance position by match length, but always at least 1
      // to prevent infinite loops with zero-length matches
      position += Math.max(1, match[0].length);
    }

    // Collapse consecutive tokens of the same type
    return this.collapseTokens(tokens);
  }

  /**
   * Collapse consecutive tokens of the same type
   * @param {Array} tokens - Array of tokens
   * @returns {Array} Collapsed tokens
   */
  collapseTokens(tokens) {
    if (tokens.length === 0) return [];

    const collapsed = [];
    let current = { ...tokens[0] };

    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === current.type) {
        // Merge with current token
        current.value += token.value;
      } else {
        // Push current and start new
        collapsed.push(current);
        current = { ...token };
      }
    }

    // Push the last token
    collapsed.push(current);

    return collapsed;
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
      // If regex is null, this is a zero-length match rule
      if (rule.regex === null) {
        return {
          match: [''], // Zero-length match
          rule
        };
      }

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

    // Expand rules with includes
    const compiled = this.expandRules(stateDef.rules, new Set());

    this.compiledRules.set(stateName, compiled);
    return compiled;
  }

  /**
   * Expand rules, resolving includes recursively
   * @param {Array} rules - Rules to expand
   * @param {Set} visited - States already visited (to prevent infinite recursion)
   * @returns {Array} Expanded compiled rules
   */
  expandRules(rules, visited) {
    const expanded = [];

    for (const rule of rules) {
      // First, process any include actions in this rule
      const includeActions = rule.actions.filter(a => a.type === 'include');
      const nonIncludeActions = rule.actions.filter(a => a.type !== 'include');

      // Expand includes from referenced states
      for (const includeAction of includeActions) {
        const includedState = this.lexerDef.states[includeAction.state];
        if (includedState) {
          // Prevent infinite recursion
          if (!visited.has(includeAction.state)) {
            visited.add(includeAction.state);
            const includedRules = this.expandRules(includedState.rules, visited);
            expanded.push(...includedRules);
          }
        }
      }

      // If there's a pattern and non-include actions, compile and add the rule
      // If there's no pattern, it's a zero-length match rule (should match at any position)
      if (nonIncludeActions.length > 0) {
        expanded.push({
          regex: rule.pattern ? this.regexEngine.compile(rule.pattern) : null,
          actions: rule.actions,
        });
      }
    }

    return expanded;
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
        });
        break;

      case 'bygroups':
        // Create one token per capture group
        // match[0] is the full match, match[1] is first group, etc.
        for (let i = 0; i < action.groups.length; i++) {
          const groupAction = action.groups[i];
          const groupIndex = i + 1; // match[0] is full match, groups start at 1

          if (groupIndex < match.length && match[groupIndex] !== undefined) {
            // Skip empty groups (e.g., optional whitespace that didn't match)
            if (match[groupIndex] !== '') {
              // If groupAction is usingself, recursively tokenize the matched text
              if (groupAction.type === 'usingself') {
                const recursiveTokens = this.tokenize(match[groupIndex], groupAction.state);
                tokens.push(...recursiveTokens);
              } else if (groupAction.type === 'token') {
                tokens.push({
                  type: groupAction.tokenType,
                  value: match[groupIndex],
                });
              }
            }
          }
        }
        break;

      case 'push':
        // Push state onto stack
        if (action.state && action.state !== '#pop') {
          stateStack.push(action.state);
        }
        break;

      case 'pop':
        // Pop specified number of states from stack
        const depth = action.depth || 1;
        const toPop = Math.min(depth, stateStack.length - 1);
        for (let i = 0; i < toPop; i++) {
          stateStack.pop();
        }
        break;

      case 'include':
        // Include is handled during rule compilation
        // No action needed here
        break;

      default:
        console.warn('Unknown action type:', action.type);
    }
  }
}
