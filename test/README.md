# Testing

This project uses test baselines from Crystal tartrazine to ensure 100% compatibility.

## Development Workflow

This project uses a git subtree to track the upstream Crystal tartrazine project. The development workflow is:

1. **vendor/tartrazine/** - Git subtree containing the full Crystal tartrazine project (used for development)
2. **lexers/** - Synced lexer XML files (used for deployment/packaging)
3. **test/fixtures/** - Imported test baselines

### Syncing Lexers

When tartrazine is updated or on initial setup:

```bash
# Sync lexer definitions from tartrazine into the codebase
node scripts/sync-lexers.js
```

This copies all 271 lexer XML files from `vendor/tartrazine/lexers/` into `lexers/` and generates a manifest. The `lexers/` directory is included in the package for deployment, while the full `vendor/tartrazine` subtree is only needed for development.

### Importing Tests

When tartrazine is updated, import the latest tests using:

```bash
# Import all tests at once
node scripts/import-tartrazine-tests.js all

# Or import specific lexer tests
node scripts/import-tartrazine-tests.js bash
```

## Test Structure

```
test/
├── fixtures/
│   ├── bash/           # Bash test inputs and baselines
│   │   ├── simple.sh
│   │   ├── simple.json
│   │   ├── test_array_nums.sh
│   │   └── ...
│   └── plaintext/      # Plaintext test inputs and baselines
│       ├── simple.txt
│       └── simple.json
└── lexers/
    ├── bash.test.js   # Bash test suite
    └── plaintext.test.js
```

## Importing Tests from Tartrazine

When tartrazine is updated, you can import the latest tests using:

```bash
# Import all tests at once (recommended)
node scripts/import-tartrazine-tests.js all

# Or import specific lexer tests
node scripts/import-tartrazine-tests.js bash
node scripts/import-tartrazine-tests.js plaintext
```

This script:
1. Reads test files from `vendor/tartrazine/spec/tests/<lexer>/`
2. Extracts the input section (between `---input---` and `---tokens---`)
3. Generates JSON baselines using the tartrazine binary
4. Saves `.sh` and `.json` files in `test/fixtures/<lexer>/`

## Running Tests

### Run all tests with vitest:
```bash
npm test
```

### Run specific lexer tests:
```bash
npx vitest test/lexers/bash.test.js
npx vitest test/lexers/plaintext.test.js
```

### Run tests with node (bypasses vitest memory issues):
```bash
node -e "
import { readdirSync, readFileSync } from 'fs';
import { Lexer } from './src/lexer.js';

const testDir = 'test/fixtures/bash';
const testFiles = readdirSync(testDir).filter(f => f.endsWith('.sh')).sort();

let passed = 0, failed = 0;

for (const testFile of testFiles) {
  const testName = testFile.replace('.sh', '');
  const jsonFile = testName + '.json';

  const code = readFileSync(\`\${testDir}/\${testFile}\`, 'utf-8');
  const expected = JSON.parse(readFileSync(\`\${testDir}/\${jsonFile}\`, 'utf-8'));

  const lexer = new Lexer('bash');
  const result = await lexer.tokenize(code);

  const match = JSON.stringify(result) === JSON.stringify(expected);

  if (match) {
    passed++;
    console.log(\`  ✅ \${testName}\`);
  } else {
    failed++;
    console.log(\`  ❌ \${testName}\`);
  }
}

console.log(\`\n\${passed} passed, \${failed} failed\`);
"
```

## Test Coverage

Current test coverage:
- ✅ **68 lexers** with 380 test files imported from tartrazine
- ⚠️ **26 tests** skipped (lexers not available in tartrazine binary)

Successfully imported tests include:
- Bash (7 tests)
- Python
- JavaScript
- C/C++
- CSS
- HTML
- YAML
- And 60+ more lexers

## Creating New Tests

To add a new test for a lexer:

1. Create input file:
   ```bash
   echo 'your code here' > test/fixtures/<lexer>/my_test.sh
   ```

2. Generate baseline:
   ```bash
   vendor/tartrazine/bin/tartrazine -f json -l <lexer> test/fixtures/<lexer>/my_test.sh > test/fixtures/<lexer>/my_test.json
   ```

3. Add to test suite in `test/lexers/<lexer>.test.js`
