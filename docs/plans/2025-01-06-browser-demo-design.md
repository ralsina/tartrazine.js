# Browser Demo Page Design

## Overview

A web-based syntax highlighting playground that showcases tartrazine.js and allows users to experiment with different languages and themes. The demo will dynamically load lexers on-demand to keep the initial page size small.

## Purpose

- **Showcase**: Demonstrate tartrazine.js capabilities to potential users
- **Interactive**: Let developers test syntax highlighting with their own code
- **Performance**: Dynamic loading keeps initial load under 100KB

## Architecture

### Components

1. **Main HTML Page** (`demo/index.html`)
   - Single-page application using ES modules
   - Split-screen layout with CSS Grid

2. **Module Loader** (`demo/lexer-loader.js`)
   - Fetches lexer XML files dynamically via `fetch()`
   - Caches loaded lexers in memory (Map structure)
   - Parses XML using fast-xml-parser

3. **UI Panel** (Left Side)
   - Language dropdown (20-30 popular languages)
   - Theme dropdown (2-3 themes: GitHub Dark, Monokai, GitHub Light)
   - Textarea for code input
   - Character/line count footer

4. **Output Panel** (Right Side)
   - Displays highlighted HTML in real-time
   - Auto-updates on input changes (debounced 300ms)
   - Theme CSS injected dynamically

5. **Example Code** (`demo/app.js`)
   - Embedded JavaScript snippets for quick testing
   - Default: JavaScript "Hello World" example

### Data Flow

```
User selects lexer
  ↓
Module loader fetches lexer XML (if not cached)
  ↓
Lexer initializes and caches
  ↓
User types/pastes code
  ↓
Debounce (300ms)
  ↓
Lexer tokenizes code
  ↓
HTML formatter generates output
  ↓
Display updates
```

## User Interface Design

### Layout

**Desktop (>768px)**: Split screen, 50/50 columns
- Left: Controls + input textarea
- Right: Preview output

**Mobile**: Stacked vertically
- Controls → Input → Output

### Controls

- **Language Dropdown**: Top 20-30 languages (JavaScript, Python, Rust, Go, etc.)
- **Theme Dropdown**: GitHub Dark, Monokai, GitHub Light

### Input Panel

- Large textarea with monospace font
- Tab key support
- Character and line count in footer

### Output Panel

- Container with rendered HTML
- White-space: pre-wrap for line wrapping
- Theme CSS in `<style>` tag

### Initial State

- Load JavaScript "Hello World" example
- Pre-select "GitHub Dark" theme
- Show highlighted output immediately

## Technical Implementation

### Module Structure

```
demo/
├── index.html              # Main demo page
├── app.js                  # Application logic
├── lexer-loader.js         # Browser-compatible loader
└── public/
    ├── styles/             # Theme XML files (copy from ../styles/)
    └── lexers/             # Lexer XML files (copy from ../src/lexers/)
```

### Browser Compatibility

**ES Modules**:
- Use `<script type="module">` for modern browsers
- Dynamic imports: `await import('../src/html-formatter.js')`

**File System → Fetch**:
- Replace `fs.readFileSync(path)` with `await fetch(path).then(r => r.text())`
- All file paths relative to demo directory

**No Build Step**:
- Native ES modules, no bundler required
- Copy src files to accessible location

### Dynamic Loading

```javascript
// lexer-loader.js
const lexerCache = new Map();

async function loadLexer(name) {
  if (lexerCache.has(name)) {
    return lexerCache.get(name);
  }

  const response = await fetch(`public/lexers/${name}.xml`);
  const xml = await response.text();

  // Parse and initialize lexer
  const lexer = new Lexer(name);
  await lexer.init(); // Loads XML via fetch

  lexerCache.set(name, lexer);
  return lexer;
}
```

### Example Code Storage

```javascript
const examples = {
  javascript: {
    code: 'function hello(name) {\n  console.log("Hello, " + name);\n}',
    lexer: 'javascript'
  },
  python: {
    code: 'def greet(name):\n    print(f"Hello, {name}")',
    lexer: 'python'
  },
  rust: {
    code: 'fn main() {\n    println!("Hello!");\n}',
    lexer: 'rust'
  }
};
```

## Error Handling

### Loading Errors

- **Lexer 404**: Show error in output, keep previous highlighting
- **Theme 404**: Fall back to GitHub Dark
- **Network error**: Show "Failed to load" with retry button
- **Parse error**: Show "Invalid lexer file" with details

### Performance

- **Debounce**: 300ms delay after typing
- **Cache**: Lexers and themes in Map structures
- **Large files**: Show warning for >10K lines

### Edge Cases

- Empty input: Empty output panel
- Long lines: `overflow-x: auto` and `white-space: pre-wrap`
- Special characters: Handled by HtmlFormatter
- No ES module support: Show "modern browser required"

## State Management

Simple object-based state:

```javascript
const state = {
  currentLexer: null,
  currentTheme: 'github-dark',
  lexerCache: new Map(),
  themeCache: new Map()
};
```

## Testing Strategy

### Manual Testing

- Load in Chrome, Firefox, Safari, Edge
- Test language switching (5-10 languages)
- Test theme switching
- Test large code snippets (>1000 lines)
- Test rapid typing (debounce)
- Test mobile view
- Test offline mode

### Browser Support

- Modern browsers with ES6+ modules
- No IE support
- Desktop and mobile

## Deployment

- Serve from `demo/` directory as root
- Static hosting (GitHub Pages, Netlify, etc.)
- No build step - just static files
- Access via GitHub Pages: `https://ralsina.github.io/tartrazine.js/demo/`

## Future Enhancements (Out of Scope)

- "Copy HTML" button
- "Share URL" with encoded code
- Font size controls
- More themes/lexers on demand
- Line numbers toggle
- Full-screen mode

## Files to Create

1. `demo/index.html` - Main page structure
2. `demo/app.js` - Application logic and event handlers
3. `demo/lexer-loader.js` - Dynamic lexer loading
4. `demo/lexer-loader.js` - Modify for browser (fetch instead of fs)
5. `demo/theme-loader.js` - Modify for browser (fetch instead of fs)
6. Copy `styles/*.xml` to `demo/public/styles/`
7. Copy `src/lexers/*.xml` to `demo/public/lexers/`

## Success Criteria

- Page loads in <2 seconds on fast connection
- Language switch feels instant (cached) or fast (<1s uncached)
- Typing feels responsive (debounced updates)
- Works in major browsers (Chrome, Firefox, Safari, Edge)
- Mobile layout is usable
- Example code demonstrates key features
