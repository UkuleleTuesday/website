/**
 * CSS Optimization Script
 *
 * Removes unused CSS rules using PurgeCSS.
 * Run this script after building the site:
 *   node optimize-css.mjs
 *
 * The script reads CSS from static/ (the canonical source) and writes
 * the optimized output to public/ only. The static/ files are never mutated,
 * so re-cloning always gives a predictable state.
 *
 * This script is wired into the build pipeline via CI (see .github/workflows/ci.yml).
 */

import { PurgeCSS } from 'purgecss';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';

// Collect all HTML and JS files from the built public/ directory
function collectFiles(dir, exts) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fp = join(dir, entry);
    if (statSync(fp).isDirectory()) {
      files.push(...collectFiles(fp, exts));
    } else if (exts.includes(extname(fp))) {
      files.push(fp);
    }
  }
  return files;
}

const htmlFiles = collectFiles('public', ['.html']);
const jsFiles = collectFiles('public', ['.js']);
const contentFiles = [...htmlFiles, ...jsFiles];

// CSS source files (read from static/) mapped to their output paths (written to public/).
// All legacy Cesis/WPBakery CSS has been consolidated into main.css (Task 9).
const cssFiles = [
  { src: 'static/css/main.css', dest: 'public/css/main.css' },
  { src: 'static/css/custom.css', dest: 'public/css/custom.css' },
];

// Safelist: classes added dynamically by JavaScript that won't appear
// literally in the static HTML files. Everything else is found by scanning
// the HTML and JS content files.
const safelist = {
  standard: [
    // mobile-menu.js – hamburger/drawer toggle
    'open',
  ],
  // Keep any selector that contains a SmartMenu state suffix, which the
  // SmartMenus library adds at runtime (e.g. .sm-dox.highlighted, .sub-arrow)
  deep: [/sub-arrow/, /\.highlighted/, /\.current-menu/],
};

async function optimizeCSS({ src, dest }) {
  const originalContent = readFileSync(src, 'utf8');
  const originalSize = Buffer.byteLength(originalContent);

  // PurgeCSS – remove unused selectors
  const purgeResults = await new PurgeCSS().purge({
    content: contentFiles,
    css: [src],
    safelist,
    // Preserve @font-face, @keyframes and CSS variables
    variables: true,
    fontFace: true,
    keyframes: true,
  });

  const purgedContent = purgeResults[0].css;

  const finalSize = Buffer.byteLength(purgedContent);
  const reduction = (((originalSize - finalSize) / originalSize) * 100).toFixed(1);

  writeFileSync(dest, purgedContent, 'utf8');
  console.log(
    `${basename(src).padEnd(35)} ${(originalSize / 1024).toFixed(1).padStart(7)} KiB → ${(finalSize / 1024).toFixed(1).padStart(7)} KiB  (${reduction}% reduction)`
  );
}

console.log('Optimizing CSS files (PurgeCSS)...\n');
console.log('File'.padEnd(35) + 'Before'.padStart(12) + '  After'.padStart(12) + '  Reduction');
console.log('-'.repeat(70));

for (const cssFile of cssFiles) {
  await optimizeCSS(cssFile);
}

console.log('\nDone. CSS optimization written to public/ only; static/ source files are unchanged.');
