/**
 * CSS Optimization Script
 *
 * Removes unused CSS rules using PurgeCSS and minifies the result using cssnano.
 * Run this script after building the site:
 *   node optimize-css.mjs
 *
 * The script overwrites the CSS files in static/ with their optimized versions.
 * Re-run `uv run python build.py` afterwards to copy to public/.
 */

import { PurgeCSS } from 'purgecss';
import postcss from 'postcss';
import cssnano from 'cssnano';
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

// Safelist: patterns for classes that may be added dynamically by JavaScript
// and therefore won't appear literally in HTML files.
const safelist = {
  standard: [
    // jQuery collapse plugin (cesis_collapse.js)
    'collapse',
    'collapsing',
    'collapsed',
    'in',
    // Mobile menu toggle (mobile-menu.js)
    'open',
    // ScrollMagic pin spacer
    'scrollmagic-pin-spacer',
  ],
  deep: [
    // WPBakery / Visual Composer (used in HTML and possibly added via JS)
    /^\.?vc_/,
    /^\.?wpb_/,
    // Cesis theme state classes
    /^\.?cesis_/,
    // Font Awesome icons
    /^\.?fa/,
    // Smart menu hover/active states
    /^\.?sm/,
    /^\.?sub-arrow/,
    // Active / hover states that jQuery might add
    /^\.?current/,
    /^\.?highlighted/,
  ],
  greedy: [
    // Keep all @font-face and @keyframes references
    /^@font-face/,
    /^@keyframes/,
  ],
};

async function optimizeCSS(cssPath) {
  const originalContent = readFileSync(cssPath, 'utf8');
  const originalSize = Buffer.byteLength(originalContent);

  // Step 1: PurgeCSS – remove unused selectors
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

  // Step 2: cssnano – minify
  const result = await postcss([cssnano({ preset: 'default' })]).process(
    purgedContent,
    { from: cssPath, to: cssPath }
  );
  const minifiedContent = result.css;

  const finalSize = Buffer.byteLength(minifiedContent);
  const reduction = (((originalSize - finalSize) / originalSize) * 100).toFixed(1);

  writeFileSync(cssPath, minifiedContent, 'utf8');
  console.log(
    `${basename(cssPath).padEnd(35)} ${(originalSize / 1024).toFixed(1).padStart(7)} KiB → ${(finalSize / 1024).toFixed(1).padStart(7)} KiB  (${reduction}% reduction)`
  );
}

console.log('Optimizing CSS files (PurgeCSS + cssnano)...\n');
console.log('File'.padEnd(35) + 'Before'.padStart(12) + '  After'.padStart(12) + '  Reduction');
console.log('-'.repeat(70));

for (const cssFile of cssFiles) {
  await optimizeCSS(cssFile);
}

console.log('\nDone. Re-run `uv run python build.py` to copy optimized files to public/.');
