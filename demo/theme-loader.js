import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.3.2';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: '#text',
  trimValues: false,
});

// Cache for loaded themes
const themeCache = new Map();

/**
 * Parse color from style string (e.g., "#f85149", "bold #ff7b72", "bg:#0d1117")
 * @param {string} styleStr - The style string
 * @returns {object} Parsed style properties
 */
function parseStyle(styleStr) {
  const style = {
    color: null,
    background: null,
    bold: false,
    italic: false,
    underline: false,
    border: null,
  };

  // Remove extra whitespace
  styleStr = styleStr.trim();

  // Check for modifiers
  style.bold = styleStr.includes('bold');
  style.italic = styleStr.includes('italic');
  style.underline = styleStr.includes('underline');

  // Remove modifiers from the string
  styleStr = styleStr.replace(/bold|italic|underline/g, '').trim();

  // Split by spaces and parse each part
  const parts = styleStr.split(/\s+/);
  for (const part of parts) {
    if (part.startsWith('bg:')) {
      // Background color
      style.background = part.substring(3);
    } else if (part.startsWith('#')) {
      // Regular color
      if (!style.color) {
        style.color = part;
      }
    }
  }

  return style;
}

/**
 * Load and parse a theme XML file (browser-compatible)
 * @param {string} themeName - Name of the theme (e.g., "github-dark")
 * @returns {Promise<object>} Parsed theme with styles and style parents
 */
export async function loadTheme(themeName) {
  // Check cache first
  if (themeCache.has(themeName)) {
    return themeCache.get(themeName);
  }

  // Fetch the theme XML file
  const xmlPath = `public/styles/${themeName}.xml`;
  const response = await fetch(xmlPath);

  if (!response.ok) {
    throw new Error(`Failed to load theme "${themeName}": ${response.statusText}`);
  }

  const xmlContent = await response.text();

  const parsed = parser.parse(xmlContent);
  const styleElement = parsed.style;

  if (!styleElement) {
    throw new Error(`Invalid theme file: missing <style> element in ${themeName}.xml`);
  }

  const entries = Array.isArray(styleElement.entry) ? styleElement.entry : [styleElement.entry];

  const theme = {
    name: themeName,
    styles: {},
    styleParents: {},
  };

  for (const entry of entries) {
    const tokenType = entry.type;
    const style = parseStyle(entry.style || '');

    theme.styles[tokenType] = style;

    // Build style parent hierarchy
    // Token types like "NameFunction" have parent "Name" which has parent "Background"
    theme.styleParents[tokenType] = getParentChain(tokenType);
  }

  // Cache the parsed theme
  themeCache.set(themeName, theme);

  return theme;
}

/**
 * Get parent chain for a token type
 * @param {string} tokenType - The token type
 * @returns {Array<string>} Parent chain from most specific to least specific
 */
function getParentChain(tokenType) {
  const parents = [];

  // Token type hierarchy based on Pygments
  // Most specific → ... → Background
  const hierarchy = {
    // Comment types
    'CommentSingle': 'Comment',
    'CommentMultiline': 'Comment',
    'CommentSpecial': 'Comment',
    'CommentPreproc': 'Comment',
    'CommentHashbang': 'CommentSingle',

    // Keyword types
    'KeywordDeclaration': 'Keyword',
    'KeywordReserved': 'Keyword',
    'KeywordConstant': 'Keyword',
    'KeywordNamespace': 'Keyword',
    'KeywordPseudo': 'Keyword',
    'KeywordType': 'Keyword',
    'KeywordOther': 'Keyword',

    // Name types
    'NameFunction': 'Name',
    'NameClass': 'Name',
    'NameException': 'Name',
    'NameVariable': 'Name',
    'NameConstant': 'Name',
    'NameAttribute': 'Name',
    'NameEntity': 'Name',
    'NameTag': 'Name',
    'NameDecorator': 'Name',
    'NameLabel': 'Name',
    'NameBuiltin': 'Name',
    'NameBuiltinPseudo': 'NameBuiltin',
    'NameProperty': 'Name',
    'NameNamespace': 'Name',
    'NameOther': 'Name',

    // Literal types
    'LiteralString': 'Literal',
    'LiteralStringSingle': 'LiteralString',
    'LiteralStringDouble': 'LiteralString',
    'LiteralStringBacktick': 'LiteralString',
    'LiteralStringDoc': 'LiteralString',
    'LiteralStringInterpol': 'LiteralString',
    'LiteralStringRegex': 'LiteralString',
    'LiteralStringSymbol': 'LiteralString',
    'LiteralStringOther': 'LiteralString',
    'LiteralNumber': 'Literal',
    'LiteralNumberBin': 'LiteralNumber',
    'LiteralNumberHex': 'LiteralNumber',
    'LiteralNumberInteger': 'LiteralNumber',
    'LiteralNumberFloat': 'LiteralNumber',
    'LiteralNumberOct': 'LiteralNumber',

    // Operator types
    'OperatorWord': 'Operator',

    // Generic types
    'GenericPrompt': 'Generic',
    'GenericError': 'Generic',
    'GenericHeading': 'Generic',
    'GenericSubheading': 'Generic',
    'GenericDeleted': 'Generic',
    'GenericInserted': 'Generic',
    'GenericEmph': 'Generic',
    'GenericStrong': 'Generic',
    'GenericEmphStrong': 'Generic',
    'GenericTraceback': 'Generic',
    'GenericOutput': 'Generic',
    'GenericOther': 'Generic',
  };

  // Walk up the hierarchy
  let current = tokenType;
  while (hierarchy[current]) {
    parents.push(hierarchy[current]);
    current = hierarchy[current];
  }

  // Always end with Background as the ultimate parent
  if (current !== 'Background') {
    parents.push('Background');
  }

  return parents;
}
