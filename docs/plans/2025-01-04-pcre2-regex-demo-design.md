# PCRE2 Regex Demo Design

**Date:** 2025-01-04
**Status:** Ready to Implement

## Overview

Create a proof-of-concept webpage demonstrating PCRE2 regex matching in the browser using pcre2-wasm. This is a foundation step for the eventual tartrazine.js port.

## Goals

- Demonstrate pcre2-wasm integration in JavaScript
- Create a simple, functional regex matcher UI
- Validate PCRE2 pattern matching capabilities
- Establish project structure for future development

## Project Structure

```
tartrazine.js/
├── package.json
├── index.html
├── src/
│   └── main.js
├── docs/
│   └── plans/
│       └── 2025-01-04-pcre2-regex-demo-design.md
└── lib/
    └── pcre2-wasm/ (installed via npm)
```

## User Interface

### Components
1. **Pattern Input**: Textarea for entering PCRE2 regex patterns
2. **Text Input**: Textarea for entering text to search
3. **Match Button**: Triggers regex matching
4. **Results Display**: Shows original text with matches highlighted in `<mark>` tags

### Styling
- Use pico.css for clean, responsive design
- Centered layout with proper spacing
- Mobile-responsive out of the box
- Yellow background for `<mark>` tags (browser default)

### User Flow
1. User enters PCRE2 pattern in first textarea
2. User enters search text in second textarea
3. User clicks "Match" button
4. Results display shows text with matches highlighted
5. Errors appear in results area with red text

## Technical Implementation

### Dependencies
- **pcre2-wasm**: PCRE2 regex engine compiled to WebAssembly
- **pico.css**: CSS framework for styling (via CDN)
- **serve**: Simple HTTP dev server (via npx)

### Key Components

#### HTML (index.html)
- Semantic HTML5 structure
- Pico.css loaded from CDN
- ES module script tag for main.js
- Container layout for centered content

#### JavaScript (src/main.js)

**Initialization:**
```javascript
- Load pcre2-wasm asynchronously on page load
- Store PCRE2 instance globally for reuse
- Handle loading errors gracefully
```

**Matching Process:**
```javascript
1. Get pattern and text from inputs
2. Validate both are non-empty
3. Compile pattern using pcre2.compile()
4. Execute match using pcre2.matchAll()
5. Build HTML with <mark> tags around matches
6. Handle errors (invalid pattern, match failures)
```

**Match Highlighting:**
- Sort matches by position
- Build HTML string with properly escaped content
- Insert `<mark>` tags around matched portions
- Handle multiple matches in same text

**Error Handling:**
- WASM loading errors
- Invalid regex patterns
- Empty inputs
- XSS prevention via HTML escaping

### Browser Compatibility
- Requires WebAssembly support (Chrome 57+, Firefox 52+, Safari 11+, Edge 16+)
- ES6 modules (modern browsers)
- No polyfills - modern browsers only

## Development Workflow

1. **Setup:**
   ```bash
   npm install
   ```

2. **Development:**
   ```bash
   npm run serve
   ```
   Opens http://localhost:8080

3. **Testing:**
   - Test basic pattern matching
   - Test error cases (invalid patterns)
   - Test multiple matches
   - Verify XSS protection

## Package Configuration

**package.json:**
```json
{
  "name": "tartrazine.js",
  "version": "0.0.1",
  "description": "JavaScript port of tartrazine syntax highlighting library",
  "type": "module",
  "scripts": {
    "serve": "npx serve -l 8080"
  },
  "dependencies": {
    "pcre2-wasm": "latest"
  }
}
```

## API Assumptions for pcre2-wasm

The implementation assumes the following API (to be verified):
- `new PCRE2()` - creates instance
- `await pcre2.init()` - initializes WASM
- `pcre2.compile(pattern)` - compiles regex, returns compiled pattern
- `pcre2.matchAll(compiled, text)` - returns array of matches with `index` and `match` properties

## Success Criteria

- [ ] Page loads without errors
- [ ] pcre2-wasm loads successfully
- [ ] Simple patterns match correctly (e.g., `\b\w{4}\b`)
- [ ] Multiple matches are all highlighted
- [ ] Invalid patterns show helpful error messages
- [ ] No XSS vulnerabilities (user input properly escaped)
- [ ] Works in at least one modern browser

## Future Considerations

This demo is intentionally simple. Future enhancements may include:
- Capture group visualization
- Real-time matching as you type
- Pattern library with examples
- Performance benchmarks for large texts
- More detailed match information (offsets, groups)

## Notes

- Keep implementation minimal - this is just a proof of concept
- Focus on getting pcre2-wasm working reliably
- Don't worry about optimizing for large texts yet
- Browser compatibility > features for now
