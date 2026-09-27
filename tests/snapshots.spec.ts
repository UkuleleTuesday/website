import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import { waitForFonts } from './utils/fontDiagnostics';
import { getAllHtmlFiles, templatesDir } from './utils/pages';

/*
 * This suite is not part of pull request CI: playwright.config.ts ignores it
 * unless VRT=1 is set. It runs on demand via the "Visual Regression" workflow,
 * which also regenerates the committed baselines on the CI runners.
 */
const templateFiles = getAllHtmlFiles(templatesDir);


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
