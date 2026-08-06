import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { waitForFonts } from './utils/fontDiagnostics';

const templatesDir = path.join(__dirname, '..', 'templates');

function getAllHtmlFiles(dirPath: string, arrayOfFiles: string[] = [], relativeDir: string = ''): string[] {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        if (file.startsWith('_') || file.startsWith('.')) continue;
        const currentRelativePath = path.join(relativeDir, file);
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllHtmlFiles(fullPath, arrayOfFiles, currentRelativePath);
        } else if (file.endsWith('.html')) {
            arrayOfFiles.push(currentRelativePath);
        }
    }
    return arrayOfFiles;
}

/*
 * Every PR runs a smoke set of representative pages (hero + images + calendar,
 * image-heavy page with form + iframe, plain form page). The full sweep of all
 * pages runs on demand via the "Visual Regression" workflow (VRT_FULL=1).
 */
const SMOKE_PAGES = ['index.html', 'concerts/index.html', 'contact-us/index.html'];
const allTemplateFiles = getAllHtmlFiles(templatesDir);
const templateFiles = process.env.VRT_FULL === '1'
    ? allTemplateFiles
    : allTemplateFiles.filter(f => SMOKE_PAGES.includes(f.split(path.sep).join('/')));


async function waitForImages(page: Page): Promise<void> {
  // RC2 step 1: trigger lazy images that are already in the DOM
  await page.evaluate(() => {
    for (const img of document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')) {
      img.setAttribute('loading', 'eager');
    }
  });

  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll<HTMLImageElement>('img')];

    // RC2: img.decode() waits for fetch + decode (img.complete fires too early
    //      for decoding="async" images).
    // RC4: document.fonts.ready prevents font-swap reflow between frames.
    await Promise.all([...imgs.map((img) => img.decode().catch(() => {})), document.fonts.ready]);

    // RC5: blur whatever Firefox auto-focused on page load
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // RC3: CSS columns/masonry layout reflows AFTER img.decode() resolves.
    // Double-rAF: first frame = layout scheduled, second = layout painted.
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    // Extra rAF for font rendering to ensure fonts are visually painted
    await new Promise<void>((r) => requestAnimationFrame(r));
  });

  // Catch any secondary requests the image loads may have triggered
  await page.waitForLoadState('networkidle');
}

async function setupPageForSnapshot(page: Page, templateFile: string): Promise<Error | null> {
    try {
        await page.goto(templateFile, { waitUntil: 'networkidle', timeout: 20000 });
        await waitForImages(page);
        await waitForFonts(page);
        return null;
    } catch (e) {
        console.log(`Navigation issue on ${templateFile}: ${e}`);
        return e as Error;
    }
}

test.describe('Visual Regression Tests', () => {
    for (const templateFile of templateFiles) {
        test.describe(templateFile, () => {
            let navigationError: Error | null = null;

            test.beforeEach(async ({ page }) => {
                navigationError = await setupPageForSnapshot(page, templateFile);
            });

            test(`default state`, async ({ page }) => {
                test.slow();
                await expect(page).toHaveScreenshot(`${templateFile}.png`, { animations: 'disabled', fullPage: true, maxDiffPixelRatio: 0.05, timeout: 10000, stylePath: path.join(__dirname, 'utils', 'snapshot.css') });
                if (navigationError) {
                    console.log(`(Non-fatal) navigation error recorded for ${templateFile}:`, navigationError);
                }
            });
        });
    }
});
