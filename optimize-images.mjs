/**
 * Image Optimization Script
 *
 * Converts JPEG/PNG source images to WebP and AVIF formats.
 * For content images (those used in <img srcset>), also generates
 * responsive variants at 300 w, 500 w, and 768 w breakpoints.
 *
 * Run this script after building the site:
 *   node optimize-images.mjs
 *
 * The script reads images from static/assets/images/ (the canonical source)
 * and writes the converted output to public/assets/images/ only. The static/
 * files are never mutated, so re-cloning always gives a predictable state.
 *
 * This script is wired into the build pipeline via CI (see .github/workflows/ci.yml).
 */

import sharp from 'sharp';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

const INPUT_DIR = 'static/assets/images';
const OUTPUT_DIR = 'public/assets/images';

// Responsive breakpoint widths to generate for content images
const RESPONSIVE_WIDTHS = [300, 500, 768];

// Content images referenced in <img srcset> in templates.
// These get responsive variants generated in addition to the full-size conversion.
const CONTENT_IMAGES = new Set([
  'Ukulele-Tuesday-jam-crowd.jpg',
  'Ukulele-Tuesday-Band-new.jpg',
  'Ukulele-Tuesday-Band-at-TedX.jpg',
  'Ukulele-Tuesday-Band-at-Cobh-2019.jpg',
  'Gig-Group-Uke.jpg',
]);

// WebP quality (0–100). 85 gives excellent quality with ~30 % size reduction vs JPEG.
const WEBP_QUALITY = 85;
// AVIF quality (0–100). 60 gives good quality; AVIF compression is more efficient than WebP.
const AVIF_QUALITY = 60;

/**
 * Returns the list of source image files to process.
 * Excludes WordPress-generated responsive variants (e.g. -300x200.jpg) because
 * those have been removed from static/ and are now generated as WebP/AVIF instead.
 */
function getSourceImages(dir) {
  return readdirSync(dir)
    .filter((file) => {
      const ext = extname(file).toLowerCase();
      if (!['.jpg', '.jpeg', '.png'].includes(ext)) return false;
      // Skip WordPress-size suffixes like -300x200, -500x334, -768x512
      if (/-.+x\d+\.(jpg|jpeg|png)$/i.test(file)) return false;
      return true;
    })
    .map((file) => join(dir, file));
}

/**
 * Converts a single image to WebP and AVIF, writing both to OUTPUT_DIR.
 * Returns stats for reporting.
 */
async function convertImage(inputPath) {
  const file = basename(inputPath);
  const ext = extname(file);
  const base = basename(file, ext);
  const originalSize = statSync(inputPath).size;

  const webpOut = join(OUTPUT_DIR, `${base}.webp`);
  const avifOut = join(OUTPUT_DIR, `${base}.avif`);

  await sharp(inputPath).webp({ quality: WEBP_QUALITY }).toFile(webpOut);
  await sharp(inputPath).avif({ quality: AVIF_QUALITY }).toFile(avifOut);

  const webpSize = statSync(webpOut).size;
  const avifSize = statSync(avifOut).size;

  return { file, originalSize, webpSize, avifSize };
}

/**
 * Generates responsive WebP and AVIF variants for a content image.
 * Variants are named {base}-{width}w.webp / {base}-{width}w.avif.
 */
async function generateResponsiveVariants(inputPath) {
  const file = basename(inputPath);
  const ext = extname(file);
  const base = basename(file, ext);

  for (const width of RESPONSIVE_WIDTHS) {
    const webpOut = join(OUTPUT_DIR, `${base}-${width}w.webp`);
    const avifOut = join(OUTPUT_DIR, `${base}-${width}w.avif`);

    await sharp(inputPath)
      .resize(width)
      .webp({ quality: WEBP_QUALITY })
      .toFile(webpOut);

    await sharp(inputPath)
      .resize(width)
      .avif({ quality: AVIF_QUALITY })
      .toFile(avifOut);
  }
}

function formatKiB(bytes) {
  return (bytes / 1024).toFixed(1).padStart(7);
}

function formatPct(from, to) {
  return (((from - to) / from) * 100).toFixed(1).padStart(5) + '%';
}

if (!existsSync(OUTPUT_DIR)) {
  console.error(`Output directory not found: ${OUTPUT_DIR}`);
  console.error('Run "uv run python build.py" first to generate the public/ directory.');
  process.exit(1);
}

const sourceImages = getSourceImages(INPUT_DIR);

console.log('Converting images to WebP + AVIF...\n');
console.log(
  'File'.padEnd(46) +
    'Original'.padStart(10) +
    '   WebP'.padStart(10) +
    '   AVIF'.padStart(10) +
    '  WebP↓'.padStart(9) +
    '  AVIF↓'.padStart(9)
);
console.log('-'.repeat(94));

let totalOriginal = 0;
let totalWebp = 0;
let totalAvif = 0;

for (const imgPath of sourceImages) {
  const { file, originalSize, webpSize, avifSize } = await convertImage(imgPath);

  totalOriginal += originalSize;
  totalWebp += webpSize;
  totalAvif += avifSize;

  console.log(
    file.padEnd(46) +
      `${formatKiB(originalSize)} KiB` +
      `${formatKiB(webpSize)} KiB` +
      `${formatKiB(avifSize)} KiB` +
      `  ${formatPct(originalSize, webpSize)}` +
      `  ${formatPct(originalSize, avifSize)}`
  );

  if (CONTENT_IMAGES.has(file)) {
    await generateResponsiveVariants(imgPath);
    for (const width of RESPONSIVE_WIDTHS) {
      const base = basename(file, extname(file));
      const webpVariant = join(OUTPUT_DIR, `${base}-${width}w.webp`);
      const avifVariant = join(OUTPUT_DIR, `${base}-${width}w.avif`);
      const wSize = statSync(webpVariant).size;
      const aSize = statSync(avifVariant).size;
      totalWebp += wSize;
      totalAvif += aSize;
      console.log(
        `  └─ ${base}-${width}w.*`.padEnd(46) +
          ' '.repeat(10) +
          `${formatKiB(wSize)} KiB` +
          `${formatKiB(aSize)} KiB`
      );
    }
  }
}

console.log('-'.repeat(94));
console.log(
  'TOTAL'.padEnd(46) +
    `${formatKiB(totalOriginal)} KiB` +
    `${formatKiB(totalWebp)} KiB` +
    `${formatKiB(totalAvif)} KiB` +
    `  ${formatPct(totalOriginal, totalWebp)}` +
    `  ${formatPct(totalOriginal, totalAvif)}`
);
console.log(
  '\nDone. Converted images written to public/ only; static/ source files are unchanged.'
);
