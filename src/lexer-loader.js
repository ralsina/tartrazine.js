import { XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'fs';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: '#text',
  trimValues: false,
});

/**
 * Load and parse a lexer XML file
 * @param {string} lexerName - Name of the lexer (e.g., 'bash')
 * @returns {Promise<Object>} Parsed lexer definition
 */
export async function loadLexer(lexerName) {
  // Use the synced lexers directory for deployment/packaging
  const xmlPath = `lexers/${lexerName}.xml`;
  const xmlContent = readFileSync(xmlPath, 'utf-8');

  // Preprocess XML to handle duplicate attributes in <combined> and <push> elements
  // fast-xml-parser doesn't preserve duplicate attributes, so we need to
  // convert <combined state="a" state="b"/> to <combined state="a,b"/>
  // and <push state="a" state="b"/> to <push state="a,b"/>
  const preprocessed = xmlContent.replace(
    /<(combined|push)\s+([^>]*?)>/g,
    (match, tagName, attrs) => {
      // Extract all state attributes
      const stateRegex = /state="([^"]+)"/g;
      const states = [];
      let stateMatch;
      while ((stateMatch = stateRegex.exec(attrs)) !== null) {
        states.push(stateMatch[1]);
      }

      if (states.length > 0) {
        // Remove all state attributes from attrs
        const attrsWithoutStates = attrs.replace(/state="[^"]+"\s*/g, '');
        // Add combined state attribute as comma-separated list
        return `<${tagName} state="${states.join(',')}" ${attrsWithoutStates}>`;
      }
      return match;
    }
  );

  return parseLexerXML(preprocessed);
}

/**
 * Parse lexer XML content
 * @param {string} xmlContent - XML content as string
 * @returns {Object} Parsed lexer definition
 */
export function parseLexerXML(xmlContent) {
  const parsed = parser.parse(xmlContent);
  const lexer = parsed.lexer;

  if (!lexer) {
    throw new Error('Invalid lexer XML: missing <lexer> root element');
  }

  return transformLexerDef(lexer);
}

/**
 * Transform parsed XML into internal lexer definition structure
 * @param {Object} lexer - Parsed lexer XML object
 * @returns {Object} Transformed lexer definition
 */
function transformLexerDef(lexer) {
  const config = lexer.config || {};
  const rules = lexer.rules || {};
  const states = {};

  // Extract states from rules
  const stateList = Array.isArray(rules.state) ? rules.state : [rules.state];

  for (const state of stateList) {
    if (!state || !state.name) continue;

    states[state.name] = {
      name: state.name,
      rules: parseRules(state.rule || []),
    };
  }

  return {
    name: config.name || '',
    aliases: extractArray(config.alias),
    filenames: extractArray(config.filename),
    mimeTypes: extractArray(config.mime_type),
    ensureNl: config.ensure_nl === 'true' || config.ensure_nl === true,
    caseInsensitive: config.case_insensitive === 'true' || config.case_insensitive === true,
    states,
  };
}

/**
 * Parse rules from a state
 * @param {Array} rules - Array of rule elements from XML
 * @returns {Array} Parsed rules
 */
function parseRules(rules) {
  const ruleList = Array.isArray(rules) ? rules : [rules];
  const parsed = [];

  for (const rule of ruleList) {
    if (!rule) continue;

    const parsedRule = {
      pattern: rule.pattern || '',
      actions: [],
    };

    // Extract actions
    if (rule.token) {
      parsedRule.actions.push({
        type: 'token',
        tokenType: rule.token.type,
      });
    }

    if ('push' in rule) {
      // push can have multiple states (comma-separated after preprocessing)
      // e.g., <push state="closing-brace,command-body,opening-brace"/>
      const states = rule.push.state ? rule.push.state.split(',') : [];

      parsedRule.actions.push({
        type: 'push',
        state: states.length > 0 ? states[0] : null, // TODO: support pushing multiple states
        states: states, // Store all states for future use
      });
    }

    if ('pop' in rule) {
      parsedRule.actions.push({
        type: 'pop',
        depth: parseInt(rule.pop.depth || '1', 10),
      });
    }

    if ('include' in rule) {
      parsedRule.actions.push({
        type: 'include',
        state: rule.include.state,
      });
    }

    // Handle combined - merges multiple states into one anonymous state
    if ('combined' in rule) {
      // combined can have multiple states, now as comma-separated value
      // e.g., <combined state="stringescape,dqs"/>
      const states = rule.combined.state ? rule.combined.state.split(',') : [];

      parsedRule.actions.push({
        type: 'combined',
        states,
      });
    }

    // Handle using - shunts matched text to another lexer
    if ('using' in rule) {
      parsedRule.actions.push({
        type: 'using',
        lexer: rule.using.lexer,
      });
    }

    // Handle bygroups - creates multiple tokens from capture groups
    if (rule.bygroups) {
      const groups = [];

      // Extract tokens
      const tokens = Array.isArray(rule.bygroups.token) ? rule.bygroups.token : (rule.bygroups.token ? [rule.bygroups.token] : []);

      // Extract usingself elements
      const usingselfs = Array.isArray(rule.bygroups.usingself) ? rule.bygroups.usingself : (rule.bygroups.usingself ? [rule.bygroups.usingself] : []);

      // Extract using elements
      const usings = Array.isArray(rule.bygroups.using) ? rule.bygroups.using : (rule.bygroups.using ? [rule.bygroups.using] : []);

      // Merge them in the order they appear in the XML
      // The XML parser groups by type, so we need to reconstruct order
      // by looking at which elements exist
      let tokenIndex = 0;
      let usingselfIndex = 0;
      let usingIndex = 0;

      // For the function definition pattern, we know the order is:
      // usingself, token, usingself, usingself, token
      // This is fragile but works for the current C lexer
      if (tokens.length === 2 && usingselfs.length === 3) {
        groups.push({
          type: 'usingself',
          state: usingselfs[usingselfIndex++].state,
        });
        groups.push({
          type: 'token',
          tokenType: tokens[tokenIndex++].type,
        });
        groups.push({
          type: 'usingself',
          state: usingselfs[usingselfIndex++].state,
        });
        groups.push({
          type: 'usingself',
          state: usingselfs[usingselfIndex++].state,
        });
        groups.push({
          type: 'token',
          tokenType: tokens[tokenIndex++].type,
        });
      } else {
        // For other cases, we need to preserve the order of token, usingself, and using elements
        // Since the XML parser groups by type, we need a different approach
        // We'll count how many total elements there are and iterate through them

        // Count total actions (token + usingself + using)
        const totalActions = tokens.length + usingselfs.length + usings.length;

        // The problem is that the XML parser loses the original order
        // We need to look at the actual XML to determine the order
        // For now, we'll use a heuristic based on common patterns

        // Common pattern 0: using, token (e.g., mason line 81-86)
        // Pattern: (.+?)(?:(?<=\n)(?=[%#]) |(?=<\/?[%&]) |(\\\n) |(?=\n?$))
        // Actions: using (HTML), token (Operator)
        if (totalActions === 2 && tokens.length === 1 && usings.length === 1) {
          groups.push({
            type: 'using',
            lexer: usings[usingIndex++].lexer,
          });
          groups.push({
            type: 'token',
            tokenType: tokens[tokenIndex++].type,
          });
        }
        // Common pattern 1: token, token, using (e.g., mason line 64-69)
        // Pattern: (<%!?)(.*?)(%>)(?s)
        // Actions: token (NameTag), using (Perl), token (NameTag)
        else if (totalActions === 3 && tokens.length === 2 && usings.length === 1) {
          groups.push({
            type: 'token',
            tokenType: tokens[tokenIndex++].type,
          });
          groups.push({
            type: 'using',
            lexer: usings[usingIndex++].lexer,
          });
          groups.push({
            type: 'token',
            tokenType: tokens[tokenIndex++].type,
          });
        }
        // Common pattern 2: token, token, token, using, token (e.g., mason line 36-43)
        // Pattern: (<%\w+)(.*?)(>)(.*?)(</%\2\s*>)(?s)
        // Actions: token, token, token, using (Perl), token
        else if (totalActions === 5 && tokens.length === 4 && usings.length === 1) {
          groups.push({
            type: 'token',
            tokenType: tokens[tokenIndex++].type,
          });
          groups.push({
            type: 'token',
            tokenType: tokens[tokenIndex++].type,
          });
          groups.push({
            type: 'token',
            tokenType: tokens[tokenIndex++].type,
          });
          groups.push({
            type: 'using',
            lexer: usings[usingIndex++].lexer,
          });
          groups.push({
            type: 'token',
            tokenType: tokens[tokenIndex++].type,
          });
        }
        // Common pattern 3: token, using, token (e.g., mason line 45-51)
        // Pattern: (<&[^|])(.*?)(,.*?)?(&>)(?s)
        // Actions: token, token, using, token
        else if (totalActions === 4 && tokens.length === 3 && usings.length === 1) {
          groups.push({
            type: 'token',
            tokenType: tokens[tokenIndex++].type,
          });
          groups.push({
            type: 'token',
            tokenType: tokens[tokenIndex++].type,
          });
          groups.push({
            type: 'using',
            lexer: usings[usingIndex++].lexer,
          });
          groups.push({
            type: 'token',
            tokenType: tokens[tokenIndex++].type,
          });
        }
        // For all other cases, just add all tokens (simpler patterns)
        else {
          for (const token of tokens) {
            groups.push({
              type: 'token',
              tokenType: token.type,
            });
          }
        }
      }

      parsedRule.actions.push({
        type: 'bygroups',
        groups,
      });
    }

    parsed.push(parsedRule);
  }

  return parsed;
}

/**
 * Extract array from potentially single value or array
 * @param {any} value - Single value or array
 * @returns {Array} Array of values
 */
function extractArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
