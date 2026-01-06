#!/usr/bin/env node
/**
 * Sync lexer XML files from tartrazine git subtree into the main codebase
 *
 * This script copies lexer definitions from vendor/tartrazine/lexers/ into the
 * lexers/ directory for proper deployment and packaging.
 *
 * Usage: node scripts/sync-lexers.js
 *
 * Run this script when:
 * - First setting up the project
 * - After updating the tartrazine git subtree
 * - When new lexers are added to tartrazine
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from 'fs';
import { execSync } from 'child_process';

const SOURCE_DIR = 'vendor/tartrazine/lexers';
const TARGET_DIR = 'lexers';
const MANIFEST_FILE = 'lexers/lexers.json';

/**
 * Extract lexer name and description from XML file
 */
function parseLexerInfo(xmlContent, filename) {
  const nameMatch = xmlContent.match(/<name>(.*?)<\/name>/);
  const descMatch = xmlContent.match(/<desc>(.*?)<\/desc>/);
  const aliasMatches = xmlContent.matchAll(/<alias>(.*?)<\/alias>/g);

  const aliases = [];
  for (const match of aliasMatches) {
    aliases.push(match[1]);
  }

  return {
    filename,
    name: nameMatch ? nameMatch[1] : filename.replace('.xml', ''),
    description: descMatch ? descMatch[1] : '',
    aliases: aliases.length > 0 ? aliases : undefined,
  };
}

/**
 * Copy a single lexer file from source to target
 */
function copyLexer(sourcePath, targetPath) {
  const content = readFileSync(sourcePath, 'utf-8');
  writeFileSync(targetPath, content, 'utf-8');
}

/**
 * Generate manifest of all available lexers
 */
function generateManifest(lexerFiles) {
  const lexers = [];

  for (const file of lexerFiles) {
    const sourcePath = `${SOURCE_DIR}/${file}`;
    const content = readFileSync(sourcePath, 'utf-8');
    const info = parseLexerInfo(content, file);
    lexers.push(info);
  }

  // Sort by name for consistent ordering
  lexers.sort((a, b) => a.name.localeCompare(b.name));

  writeFileSync(MANIFEST_FILE, JSON.stringify(lexers, null, 2), 'utf-8');
  return lexers;
}

/**
 * Sync all lexers from tartrazine to codebase
 */
function syncLexers() {
  console.log('🔄 Syncing lexers from tartrazine...\n');

  // Verify source directory exists
  if (!existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
    console.error('Make sure the tartrazine git subtree is properly set up.');
    process.exit(1);
  }

  // Get all XML files from source
  const sourceFiles = readdirSync(SOURCE_DIR).filter(f => f.endsWith('.xml'));

  if (sourceFiles.length === 0) {
    console.error(`❌ No lexer files found in ${SOURCE_DIR}`);
    process.exit(1);
  }

  console.log(`📦 Found ${sourceFiles.length} lexers in tartrazine`);

  // Create target directory if it doesn't exist
  if (!existsSync(TARGET_DIR)) {
    mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`📁 Created target directory: ${TARGET_DIR}`);
  }

  // Copy each lexer file
  let copied = 0;
  let skipped = 0;

  for (const file of sourceFiles) {
    const sourcePath = `${SOURCE_DIR}/${file}`;
    const targetPath = `${TARGET_DIR}/${file}`;

    // Check if file needs to be updated
    if (existsSync(targetPath)) {
      const sourceStats = execSync(`git status --porcelain "${sourcePath}"`, { encoding: 'utf-8' });
      const sourceContent = readFileSync(sourcePath, 'utf-8');
      const targetContent = readFileSync(targetPath, 'utf-8');

      if (sourceContent === targetContent) {
        skipped++;
        continue;
      }
    }

    copyLexer(sourcePath, targetPath);
    copied++;
    console.log(`  ✅ ${file}`);
  }

  console.log(`\n📊 Copied: ${copied}, Skipped: ${skipped}`);

  // Generate manifest
  console.log('\n📝 Generating lexer manifest...');
  const lexers = generateManifest(sourceFiles);
  console.log(`  ✅ Created ${MANIFEST_FILE}`);
  console.log(`  📋 Total lexers: ${lexers.length}`);

  // Show some examples
  console.log('\n🔍 Sample lexers:');
  for (const lexer of lexers.slice(0, 5)) {
    console.log(`  - ${lexer.name} (${lexer.filename})`);
    if (lexer.aliases) {
      console.log(`    Aliases: ${lexer.aliases.join(', ')}`);
    }
  }

  if (lexers.length > 5) {
    console.log(`  ... and ${lexers.length - 5} more`);
  }

  console.log('\n✨ Lexer sync complete!');
  console.log(`\n💡 Tip: Add ${TARGET_DIR} to .gitignore if you want to track`);
  console.log(`   the sync script instead of the actual XML files.`);
}

// Run the sync
syncLexers();
