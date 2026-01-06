# Tartrazine.js - Browser Usage Guide

Tartrazine.js is a JavaScript syntax highlighting library that works both in Node.js and in the browser. This guide covers browser usage.

## Installation

### NPM (Recommended for Bundlers)

```bash
npm install tartrazine.js
```

### CDN (Script Tag)

```html
<!-- IIFE build - creates global Tartrazine object -->
<script src="https://cdn.jsdelivr.net/npm/tartrazine.js/dist/tartrazine.iife.js"></script>
```

## Quick Start

### Simple API - One Function

The easiest way to get started:

```javascript
import { highlight } from 'tartrazine.js';

const code = `
function hello(name) {
  console.log(\`Hello, \${name}!\`);
}
`;

const html = await highlight(code, 'javascript', 'github-dark');
document.getElementById('output').innerHTML = html;
```

### With Script Tag

```html
<script src="https://cdn.jsdelivr.net/npm/tartrazine.js/dist/tartrazine.iife.js"></script>
<script>
  const html = await Tartrazine.highlight(code, 'javascript', 'github-dark');
  document.getElementById('output').innerHTML = html;
</script>
```

## Web Component

The easiest way - use a custom HTML element:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import 'tartrazine.js';
  </script>
</head>
<body>
  <syntax-highlight language="javascript" theme="github-dark" line-numbers>
    function hello(name) {
      console.log(`Hello, ${name}!`);
    }
  </syntax-highlight>
</body>
</html>
```

### Web Component Attributes

- `language` - The programming language (e.g., 'javascript', 'python', 'rust')
- `theme` - The color theme (e.g., 'github-dark', 'monokai', 'github')
- `line-numbers` - Show line numbers (present attribute = true)
- `standalone` - Generate full HTML document with CSS

### Dynamic Content with Web Component

```javascript
const element = document.querySelector('syntax-highlight');
element.textContent = newCode;
element.setAttribute('language', 'python');
// Component auto-renders when attributes or content change
```

## Advanced API

For more control, use the class-based API:

```javascript
import { Lexer, HtmlFormatter, loadTheme } from 'tartrazine.js';

// Create lexer
const lexer = new Lexer('javascript');
await lexer.init();

// Tokenize code
const code = 'const x = 42;';
const tokens = await lexer.tokenize(code);

// Create formatter
const theme = await loadTheme('github-dark');
const formatter = new HtmlFormatter({ theme });

// Format to HTML
const html = await formatter.format(code, tokens);
```

## Hosting Assets

By default, tartrazine.js loads lexer and theme XML files from relative paths:
- `lexers/[name].xml`
- `styles/[name].xml`

You have two options:

### Option 1: Host with Your Application

Copy the `assets/` directory from the npm package to your web server:

```bash
cp -r node_modules/tartrazine.js/assets ./public/
```

Then configure the base URL:

```javascript
import { setAssetBase } from 'tartrazine.js';

setAssetBase('/assets');
```

### Option 2: Use CDN

Configure tartrazine to load from CDN:

```javascript
setAssetBase('https://cdn.jsdelivr.net/npm/tartrazine.js/assets');
```

## Available Languages

tartrazine.js supports 100+ languages including:

**Popular:**
- javascript, typescript, python, rust, go, java, c, c++, ruby, php
- html, css, json, yaml, sql, markdown, bash, swift, kotlin, scala
- haskell, lua, perl, r, matlab, julia, elixir, erlang, clojure

See `lexers/` directory for complete list.

## Available Themes

- github-dark, github, monokai, monokailight
- dracula, nord, solarized-dark, solarized-light
- gruvbox, gruvbox-light
- onedark, tokyonight-night, tokyonight-day
- And 50+ more - see `styles/` directory

## Configuration Options

### Simple API Options

```javascript
const html = await highlight(code, language, theme, {
  lineNumbers: true,      // Show line numbers
  standalone: true         // Full HTML with CSS
});
```

### HtmlFormatter Options

```javascript
const formatter = new HtmlFormatter({
  theme: 'github-dark',
  classPrefix: '',          // CSS class prefix
  lineNumbers: false,       // Enable line numbers
  lineNumberStart: 1,       // Starting line number
  standalone: false,        // Wrap in full HTML document
  surroundingPre: true,     // Wrap in <pre> tags
  wrapLongLines: false,     // Enable line wrapping
  weightOfBold: 600         // CSS font-weight for bold
});
```

## Examples

### Example 1: Basic Highlighting

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { highlight } from 'tartrazine.js';

    const code = 'const x = 42;';
    const html = await highlight(code, 'javascript', 'github-dark');
    document.body.innerHTML = html;
  </script>
</head>
<body></body>
</html>
```

### Example 2: Multiple Languages

```html
<script type="module">
  import { highlight } from 'tartrazine.js';

  const jsCode = 'const x = 42;';
  const pyCode = 'x = 42';

  document.getElementById('js').innerHTML =
    await highlight(jsCode, 'javascript', 'github-dark');

  document.getElementById('py').innerHTML =
    await highlight(pyCode, 'python', 'monokai');
</script>

<pre><code id="js"></code></pre>
<pre><code id="py"></code></pre>
```

### Example 3: Line Numbers

```html
<syntax-highlight language="javascript" theme="github-dark" line-numbers>
  function hello() {
    console.log('Hi');
  }
</syntax-highlight>
```

### Example 4: Event Handling

```html
<syntax-highlight id="code-block" language="javascript">
  // code here
</syntax-highlight>

<script>
  const element = document.getElementById('code-block');

  element.addEventListener('highlighted', (event) => {
    console.log('Highlighted!', event.detail);
    // { language: 'javascript', theme: 'github-dark' }
  });
</script>
```

## Performance Tips

1. **Cache Lexers** - The simple API caches lexers automatically
2. **Lazy Loading** - Lexers and themes load on-demand
3. **Debounce Input** - For editors, debounce user input (300ms recommended)
4. **Web Workers** - For large files, consider offloading to a web worker

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- ES modules support
- Fetch API
- Async/await

## Migration from Demo Code

The demo code in `/demo` shows manual implementation. For production use:

1. Use the npm package instead
2. Import from `tartrazine.js` instead of relative paths
3. Use the `highlight()` function for simple cases
4. Use `<syntax-highlight>` component for declarative usage

## Troubleshooting

### "Failed to load lexer"

Make sure assets are hosted and accessible:
```javascript
// Check asset base URL
console.log('Asset base:', window.__tartrazine_asset_base);

// Set correct path
setAssetBase('/path/to/assets');
```

### "Module not found" errors

For bundlers, ensure you're using the ESM build:
```javascript
import { highlight } from 'tartrazine.js'; // Uses dist/tartrazine.js
```

For script tags, use the IIFE build:
```html
<script src="tartrazine.iife.js"></script>
```

## Next Steps

- Explore the [demo](../demo/) for more examples
- Check the [API documentation](../README.md)
- View [source code](../src/) for advanced customization
