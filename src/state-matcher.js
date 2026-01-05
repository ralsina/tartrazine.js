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

    // Track iterations to prevent infinite loops
    let iterations = 0;
    const maxIterations = text.length * 100; // Safety limit

    while (position < text.length) {
      // Prevent infinite loops
      iterations++;
      if (iterations > maxIterations) {
        console.error('Infinite loop detected in tokenization');
        break;
      }

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
        // No rule matches at current position
        // According to Pygments docs: "the current char is emitted as an Error token...
        // and the position is increased by one"
        // However, this can lead to alternating Error/Text tokens when there are
        // patterns like \s+ that match between error tokens.
        // A better approach: create the Error token, then skip ahead to find the
        // next position where a pattern might match, and consume everything in
        // between as Text.

        const char = text[position];
        const errorToken = { type: 'Error', value: char };
        tokens.push(errorToken);
        position++;

        // Special newline handling from Pygments:
        // "If the RegexLexer encounters a newline that is flagged as an error token,
        // the stack is emptied and the lexer continues scanning in the 'root' state."
        if (char === '\n') {
          stateStack = ['root'];
        }

        // Don't continue trying to match more rules - instead continue to next position
        // This prevents patterns like \s+ from matching between consecutive Error tokens
        continue;
      }

      // Execute actions for the matched rule
      const { match, rule } = matchResult;

      // Only execute token actions if the match has non-zero length
      // Zero-length matches (like lookaheads) should not generate tokens
      const matchLength = match[0].length || 0;
      if (matchLength > 0) {
        for (const action of rule.actions) {
          this.executeAction(action, match, stateStack, tokens, position);
        }
        // Advance position by match length
        position += matchLength;
      } else {
        // For zero-length matches, only execute non-token actions (push, pop, include)
        // Do NOT advance position - continue to next rule
        for (const action of rule.actions) {
          if (action.type !== 'token' && action.type !== 'bygroups') {
            this.executeAction(action, match, stateStack, tokens, position);
          }
        }
        // Continue to next rule instead of breaking
        continue;
      }
    }

    // Collapse consecutive tokens of the same type
    // Note: Crystal's collapse only merges tokens of the same type
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
          regex: rule.pattern ? this.regexEngine.compile(rule.pattern, '', this.lexerDef.caseInsensitive) : null,
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
        // Push state(s) onto stack
        // Can have multiple states to push in sequence
        // If no state specified (null or empty), push the current state again (for nested structures)
        const statesToPush = action.states || (action.state ? [action.state] : []);

        if (statesToPush.length === 0) {
          // <push/> without state means push current state
          stateStack.push(stateStack[stateStack.length - 1]);
        } else {
          // Push each state in sequence
          for (const state of statesToPush) {
            if (state === '#pop' && stateStack.length > 1) {
              // #pop means pop the state instead of pushing
              stateStack.pop();
            } else {
              stateStack.push(state);
            }
          }
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

      case 'combined': {
        // Combine multiple states into one anonymous state
        // Merge rules from all specified states
        const mergedRules = [];
        for (const stateName of action.states) {
          const stateDef = this.lexerDef.states[stateName];
          if (stateDef && stateDef.rules) {
            mergedRules.push(...stateDef.rules);
          }
        }

        // Create anonymous state with a unique name
        const anonymousStateName = `__combined_${Date.now()}_${Math.random().toString(36).substring(2, 10)}__`;

        // Add the new state to the lexer definition
        this.lexerDef.states[anonymousStateName] = {
          name: anonymousStateName,
          rules: mergedRules,
        };

        // Push the anonymous state onto the stack
        stateStack.push(anonymousStateName);
        break;
      }

      default:
        console.warn('Unknown action type:', action.type);
    }
  }
}
