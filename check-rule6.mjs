import { Lexer } from './src/lexer.js';
import { StateMatcher } from './src/state-matcher.js';

const fs = await import('fs');
const text = fs.readFileSync('test/fixtures/bash/simple.sh', 'utf-8');

const lexer = new Lexer('bash');
await lexer.init();

// Test 1: Get rules from fresh StateMatcher
console.log('TEST 1: Fresh StateMatcher');
const matcher1 = new StateMatcher(lexer.lexerDef);
const rules1 = matcher1.getCompiledRules('root');
const lbracketPos = text.indexOf('if [ ') + 3;
console.log('"[" at position:', lbracketPos);
console.log('Rule 6 (first 5 rules):');
rules1.slice(0, 5).forEach((r, i) => {
  console.log(`  ${i}: ${r.regex.toString().substring(0, 80)}`);
});
console.log();

// Test if rule 6 matches
const match1 = matcher1.regexEngine.match(rules1[6].regex, text, lbracketPos);
console.log('Rule 6 match at position', lbracketPos, ':', match1 ? `"${match1[0]}" at ${match1.index}` : 'NO MATCH');
console.log();

// Test 2: Get rules after tokenizing
console.log('TEST 2: After tokenizing starts');
const matcher2 = new StateMatcher(lexer.lexerDef);
const result = matcher2.tokenize(text.substring(0, lbracketPos), 'root');
console.log('Tokenized', result.length, 'tokens, now at position', lbracketPos);
const rules2 = matcher2.getCompiledRules('root');
const match2 = matcher2.regexEngine.match(rules2[6].regex, text, lbracketPos);
console.log('Rule 6 match at position', lbracketPos, ':', match2 ? `"${match2[0]}" at ${match2.index}` : 'NO MATCH');
