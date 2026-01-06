#!/usr/bin/env node

/**
 * Copy lexer and theme XML files to dist/assets
 * This script runs as part of the build process
 */

import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const sourceDirs = {
  lexers: 'lexers',
  styles: 'styles'
};

const targetDir = 'dist/assets';

console.log('Copying assets to dist/assets...');

// Create target directory structure
for (const [name, sourceDir] of Object.entries(sourceDirs)) {
  const targetPath = join(targetDir, name);

  if (!existsSync(targetPath)) {
    mkdirSync(targetPath, { recursive: true });
    console.log(`  Created ${targetPath}`);
  }

  // Copy all XML files
  const files = readdirSync(sourceDir).filter(f => f.endsWith('.xml'));

  for (const file of files) {
    const sourcePath = join(sourceDir, file);
    const destPath = join(targetPath, file);
    copyFileSync(sourcePath, destPath);
  }

  console.log(`  Copied ${files.length} ${name}`);
}

console.log('✓ Assets copied successfully');
