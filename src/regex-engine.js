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
   * @returns {RegExp} Compiled regular expression
   */
  compile(pattern, flags = '') {
    const cacheKey = `${pattern}::${flags}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const regex = this.createRegex(pattern, flags);
    this.cache.set(cacheKey, regex);
    return regex;
  }

  /**
   * Create RegExp from Oniguruma pattern
   * @param {string} pattern - Oniguruma/PCRE2 pattern
   * @param {string} flags - Pattern flags
   * @returns {RegExp} JavaScript RegExp object
   */
  createRegex(pattern, flags) {
    try {
      // Parse flags
      const options = {
        global: false, // We don't want global matching by default
        forgiving: true, // Be lenient with unsupported features
      };

      // Handle flag modifiers in pattern
      // Oniguruma uses (?i), (?m), (?s) inline modifiers
      // JavaScript doesn't support inline flags, so we extract them and add to RegExp flags
      let cleanPattern = pattern;
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
      if (flags.includes('i') && !jsFlags.includes('i')) {
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

      return new RegExp(regex.source, finalFlags);
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
    // Extract substring from startOffset and match
    const substring = text.substring(startOffset);
    const result = regex.exec(substring);

    if (!result) {
      return null;
    }

    // Adjust the index to be relative to the original text
    result.index = result.index + startOffset;

    return result;
  }

  /**
   * Clear the pattern cache
   */
  clearCache() {
    this.cache.clear();
  }
}
