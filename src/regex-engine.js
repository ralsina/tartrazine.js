import { toRegExp } from 'oniguruma-to-es';

/**
 * Regex engine wrapper around oniguruma-to-es
 * Converts Oniguruma/PCRE2 patterns to native JavaScript RegExp
 */
export class RegexEngine {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Compile a pattern with flags
   * @param {string} pattern - Oniguruma/PCRE2 pattern
   * @param {string} flags - Pattern flags (m, i, s, etc.)
   * @param {boolean} caseInsensitive - Whether to make the pattern case-insensitive
   * @returns {RegExp} Compiled regular expression
   */
  compile(pattern, flags = '', caseInsensitive = false) {
    const cacheKey = `${pattern}::${flags}::${caseInsensitive}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const regex = this.createRegex(pattern, flags, caseInsensitive);
    this.cache.set(cacheKey, regex);
    return regex;
  }

  /**
   * Transform PCRE2 pattern to be compatible with oniguruma-to-es
   * @param {string} pattern - PCRE2 pattern
   * @returns {string} Transformed pattern
   */
  transformPattern(pattern) {
    // The Rust lexer has pattern "#![ ^[ \r\n ].*$" where \r and \n are literal
    // backslash+r and backslash+n (two characters each, not escape sequences).
    // This pattern can't be parsed by oniguruma-to-es due to the [^[] sequence.
    // The [ exclusion in [^[ is redundant since #! already doesn't match #[foo].
    // We remove the [ from the character class to make it compatible.

    // Construct the pattern using character codes to match the literal backslashes
    const rustShebangPattern = String.fromCharCode(35, 33, 91, 94, 91, 92, 114, 92, 110, 93, 46, 42, 36); // #![ ^[ \r\n ].*$
    const transformedRustPattern = String.fromCharCode(35, 33, 91, 94, 92, 114, 92, 110, 93, 46, 42, 36); // #![ ^\r\n].*$

    if (pattern === rustShebangPattern) {
      return transformedRustPattern;
    }

    // The Python lexer has pattern "[]{}:(),;[]" where [] matches literal ]
    // In PCRE2, [] at the start or end of a character class matches a literal ]
    // oniguruma-to-es interprets [] as an empty character class (error).
    // We need to escape the ] characters to make it compatible.
    if (pattern === '[]{}:(),;[]') {
      return '[\\]{}:(),;\\[]';
    }

    return pattern;
  }

  /**
   * Create RegExp from Oniguruma pattern
   * @param {string} pattern - Oniguruma/PCRE2 pattern
   * @param {string} flags - Pattern flags
   * @param {boolean} caseInsensitive - Whether to make the pattern case-insensitive
   * @returns {RegExp} JavaScript RegExp object
   */
  createRegex(pattern, flags, caseInsensitive = false) {
    try {
      // Parse flags
      const options = {
        global: false, // We don't want global matching by default
        forgiving: true, // Be lenient with unsupported features
        recursionLimit: 10, // Aggressively limit recursion to prevent catastrophic backtracking
        lazyCompileLength: 1, // Lazy compile very short patterns
      };

      // Transform PCRE2 pattern for compatibility
      let cleanPattern = this.transformPattern(pattern);

      // Handle flag modifiers in pattern
      // Oniguruma uses (?i), (?m), (?s) inline modifiers
      // JavaScript doesn't support inline flags, so we extract them and add to RegExp flags
      let jsFlags = '';

      // Check for inline flag modifiers and add to jsFlags
      if (cleanPattern.includes('(?i)')) {
        jsFlags += 'i';
        cleanPattern = cleanPattern.replace(/\(\?i\)/g, '');
      }
      if (cleanPattern.includes('(?m)')) {
        jsFlags += 'm';
        cleanPattern = cleanPattern.replace(/\(\?m\)/g, '');
      }
      if (cleanPattern.includes('(?s)')) {
        jsFlags += 's'; // JavaScript's dotAll flag - makes . match newlines
        cleanPattern = cleanPattern.replace(/\(\?s\)/g, '');
      }

      // Also check explicit flags passed as parameter
      if ((flags.includes('i') || caseInsensitive) && !jsFlags.includes('i')) {
        jsFlags += 'i';
      }
      if (flags.includes('m') && !jsFlags.includes('m')) {
        jsFlags += 'm';
      }
      if (flags.includes('s') && !jsFlags.includes('s')) {
        jsFlags += 's';
      }

      // Convert to JavaScript RegExp using oniguruma-to-es
      const regex = toRegExp(cleanPattern, options);

      // Use the regex from oniguruma-to-es directly (it has 'v' flag for Unicode)
      // Just add our custom flags (i, m, s) if not already present
      let finalFlags = regex.flags;
      if (jsFlags.includes('i') && !finalFlags.includes('i')) {
        finalFlags += 'i';
      }
      if (jsFlags.includes('m') && !finalFlags.includes('m')) {
        finalFlags += 'm';
      }
      if (jsFlags.includes('s') && !finalFlags.includes('s')) {
        finalFlags += 's';
      }

      // oniguruma-to-es transforms . to [^\n] when (?s) is not present
      // If we're adding the s flag (dotAll mode), we need to revert this
      // transformation so that . matches newlines as intended
      let finalSource = regex.source;
      if (finalFlags.includes('s')) {
        // Replace [^\n] with . so dotAll mode works correctly
        // This reverses the common case where . was transformed to [^\n]
        // The source contains literal backslash-n, so we need \\n in the regex
        finalSource = finalSource.replace(/\[\^\\n\]/g, '.');
      }

      return new RegExp(finalSource, finalFlags);
    } catch (error) {
      throw new Error(`Failed to compile pattern "${pattern}": ${error.message}`);
    }
  }

  /**
   * Execute regex and return match result
   * @param {RegExp} regex - Compiled regex
   * @param {string} text - Text to match against
   * @param {number} startOffset - Starting position in text
   * @returns {Match|null} Match result or null if no match
   */
  match(regex, text, startOffset = 0) {
    // Use sticky flag with lastIndex to match at specific position
    // This preserves ^ and \b anchors correctly
    const stickyRegex = new RegExp(regex.source, regex.flags + 'y');
    stickyRegex.lastIndex = startOffset;

    const result = stickyRegex.exec(text);

    if (!result) {
      return null;
    }

    return result;
  }

  /**
   * Clear the pattern cache
   */
  clearCache() {
    this.cache.clear();
  }
}
