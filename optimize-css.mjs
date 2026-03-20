/**
 * CSS Optimization Script
 *
 * Removes unused CSS rules using PurgeCSS.
 * Run this script after building the site:
 *   node optimize-css.mjs
 *
 * The script overwrites the CSS files in static/ with their optimized versions.
 * Re-run `uv run python build.py` afterwards to copy to public/.
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

// CSS files to optimize (source paths in static/)
const cssFiles = [
  'static/wordpress/wp-content/themes/cesis/style.css',
  'static/wordpress/wp-content/themes/cesis/css/cesis_plugins.css',
  'static/wordpress/wp-content/themes/cesis/css/cesis_media_queries.css',
  'static/wordpress/wp-content/themes/cesis/includes/fonts/cesis_icons/cesis_icons.css',
  'static/css/main.css',
  'static/js/js_composer.min.css',
  'static/css/custom.css',
];

// Safelist: classes added dynamically by JavaScript that won't appear
// literally in the static HTML files. Everything else is found by scanning
// the HTML and JS content files.
const safelist = {
  standard: [
    // cesis_collapse.js – Bootstrap-style collapse state classes
    'collapse',
    'collapsing',
    'collapsed',
    'in',
    // mobile-menu.js – hamburger/drawer toggle
    'open',
    // isotope.js – drag-and-drop positioning helpers
    'is-positioning-post-drag',
    'packery-drop-placeholder',
    // jquery-ui effect.min.js – animation wrappers
    'ui-effects-placeholder',
    'ui-effects-wrapper',
  ],
  // Keep any selector that contains a SmartMenu state suffix, which the
  // SmartMenus library adds at runtime (e.g. .sm-dox.highlighted, .sub-arrow)
  deep: [/sub-arrow/, /\.highlighted/, /\.current-menu/],
};

async function optimizeCSS(cssPath) {
  const originalContent = readFileSync(cssPath, 'utf8');
  const originalSize = Buffer.byteLength(originalContent);

  // PurgeCSS – remove unused selectors
  const purgeResults = await new PurgeCSS().purge({
    content: contentFiles,
    css: [cssPath],
    safelist,
    // Preserve @font-face, @keyframes and CSS variables
    variables: true,
    fontFace: true,
    keyframes: true,
  });

  const purgedContent = purgeResults[0].css;

  const finalSize = Buffer.byteLength(purgedContent);
  const reduction = (((originalSize - finalSize) / originalSize) * 100).toFixed(1);

  writeFileSync(cssPath, purgedContent, 'utf8');
  console.log(
    `${basename(cssPath).padEnd(35)} ${(originalSize / 1024).toFixed(1).padStart(7)} KiB → ${(finalSize / 1024).toFixed(1).padStart(7)} KiB  (${reduction}% reduction)`
  );
}

console.log('Optimizing CSS files (PurgeCSS)...\n');
console.log('File'.padEnd(35) + 'Before'.padStart(12) + '  After'.padStart(12) + '  Reduction');
console.log('-'.repeat(70));

for (const cssFile of cssFiles) {
  await optimizeCSS(cssFile);
}

console.log('\nDone. Re-run `uv run python build.py` to copy optimized files to public/.');
