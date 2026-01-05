import { XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'fs';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: '#text',
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
  return parseLexerXML(xmlContent);
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

    if (rule.push) {
      parsedRule.actions.push({
        type: 'push',
        state: rule.push.state,
      });
    }

    if (rule.pop) {
      parsedRule.actions.push({
        type: 'pop',
        depth: parseInt(rule.pop.depth || '1', 10),
      });
    }

    if (rule.include) {
      parsedRule.actions.push({
        type: 'include',
        state: rule.include.state,
      });
    }

    // Handle bygroups - creates multiple tokens from capture groups
    if (rule.bygroups) {
      const groups = [];

      // Extract tokens
      const tokens = Array.isArray(rule.bygroups.token) ? rule.bygroups.token : (rule.bygroups.token ? [rule.bygroups.token] : []);

      // Extract usingself elements
      const usingselfs = Array.isArray(rule.bygroups.usingself) ? rule.bygroups.usingself : (rule.bygroups.usingself ? [rule.bygroups.usingself] : []);

      // Merge them in the order they appear in the XML
      // The XML parser groups by type, so we need to reconstruct order
      // by looking at which elements exist
      let tokenIndex = 0;
      let usingselfIndex = 0;

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
        // For other cases, just add all tokens (simpler patterns)
        for (const token of tokens) {
          groups.push({
            type: 'token',
            tokenType: token.type,
          });
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
