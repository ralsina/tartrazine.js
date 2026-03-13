# Bug Report: Tartrazine Markdown Lexer Removes Closing Fenced Code Block Backticks

## Summary

When highlighting markdown text with fenced code blocks that have a language specified, tartrazine.js incorrectly removes the closing ``` when there are trailing newlines after the code block.

## Steps to Reproduce

1. Create markdown text with a fenced code block with language specification:
   ```
   ```python
   def f():
   ```


   ```

2. Pass it through `Tartrazine.highlight(code, 'markdown', {standalone: false, lineNumbers: false})`

3. The returned HTML's `textContent` will have the closing ``` removed:
   - **Input**: ```` ```python\ndef f():\n```\n\n```` (23 characters)
   - **Output**: ```` ```python\ndef f():\n\n\n```` (20 characters)

## Detailed Example

```javascript
const code = "```python\ndef f()\n```\n\n";
const html = await Tartrazine.highlight(code, 'markdown', {
  standalone: false,
  lineNumbers: false
});

// Create temp div to extract text content
const temp = document.createElement('div');
temp.innerHTML = html;
const outputText = temp.textContent;

console.log('Input:', JSON.stringify(code));      // "```python\ndef f()\n```\n\n"
console.log('Output:', JSON.stringify(outputText)); // "```python\ndef f()\n\n\n"
console.log('Lengths:', code.length, '→', outputText.length); // 23 → 20
```

## Key Observations

1. **Only happens with language specification**: ```` ```python ```` triggers the bug, but ```` ``` ```` (without language) works fine
2. **Requires trailing content**: The bug only occurs when there are newlines/characters after the closing ```
3. **Text content is modified**: The `textContent` of the returned HTML differs from the input, causing data loss
4. **Breaks editors**: In live editors like CodeJar, this causes the closing backticks to disappear as you type

## Test Cases

### ✅ Works: Complete code block, no trailing content
```javascript
"```python\ndef f()\n```"
```

### ❌ Broken: Code block with trailing newlines
```javascript
"```python\ndef f()\n```\n\n"
```

### ✅ Works: Code block without language
```javascript
"```\ndef f()\n```\n\n"
```

## Expected Behavior

The `textContent` of the returned HTML should be **identical** to the input text. Tartrazine should preserve all characters including closing fenced code block delimiters, only adding HTML markup for syntax highlighting.

## Impact

This bug makes tartrazine.js unusable for real-time markdown editing in code editors where the highlighted output is used to replace the editor content (via `innerHTML`). Users cannot type closing fenced code blocks because they get immediately deleted.

## Environment

- Tartrazine version: 0.20.1
- Language: `markdown`
- Browser: Any (tested in Chromium-based browsers)
- Mode: `{standalone: false, lineNumbers: false}`

## Related Code

This bug was discovered in the Pasto pastebin application when using tartrazine.js for live syntax highlighting in a CodeJar editor. The editor calls `highlight()` on every keystroke, and the text content modification causes characters to disappear.
