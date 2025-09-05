import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { waitForFonts, setupFontNetworkLogging } from './utils/fontDiagnostics';

const templatesDir = path.join(__dirname, '..', 'templates');
const artifactsDir = path.join(__dirname, '..', 'artifacts');

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

const templateFiles = getAllHtmlFiles(templatesDir);

const expectedFamilies = (process.env.EXPECT_FONTS || 'Quicksand,Pattaya').split(',').map(f => f.trim()).filter(Boolean);

test.beforeAll(async () => {
    if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
    }
});

test.describe('Visual Regression Tests', () => {
    test.describe.configure({ mode: 'serial' });

    for (const templateFile of templateFiles) {
        test(`visual regression for ${templateFile}`, async ({ page }, testInfo) => {
            test.slow();
        const sanitizedTemplateFile = templateFile.replace(/[<>:"/\\|?*]/g, '_').replace(/ /g, '_');
        const baseName = sanitizedTemplateFile;
        const fontNet = { requests: [] };
        setupFontNetworkLogging(page, fontNet);
        let navigationError = null;
        try {
            await page.goto(templateFile, { waitUntil: 'load', timeout: 20000 });
            // Wait for Google Fonts CSS to be loaded to reduce flakiness
            await page.waitForResponse(
                resp => resp.url().includes('fonts.googleapis.com/css') && resp.status() === 200,
                { timeout: 10000 }
            ).catch(() => console.warn(`Google Fonts CSS request not intercepted for ${templateFile}.`));

            // Replace dynamic embeds with a static placeholder to prevent flaky tests
            await page.addStyleTag({
                content: `
              iframe[src*="youtube.com"],
              iframe[src*="youtu.be"],
              iframe[src*="vimeo.com"],
              .vc_video-bg {
                visibility: hidden !important;
                position: relative !important;
              }
              iframe[src*="youtube.com"]::before,
              iframe[src*="youtu.be"]::before,
              iframe[src*="vimeo.com"]::before,
              .vc_video-bg::before {
                content: 'Video Placeholder';
                visibility: visible !important;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #e0e0e0;
                color: #666;
                font-family: sans-serif;
                border: 2px dashed #999;
                box-sizing: border-box;
              }
            `
            });
        } catch (e) {
            navigationError = e;
            console.log(`Navigation issue on ${templateFile}: ${e}`);
        }
        await page.screenshot({ path: path.join(artifactsDir, `${baseName}_prefonts.png`), fullPage: true });
        const fontStatus = await waitForFonts(page);
        await page.screenshot({ path: path.join(artifactsDir, `${baseName}_postfonts.png`), fullPage: true });
        const computedSamples = await page.evaluate(() => {
            const selectors = ['h1', 'h2', 'p', 'nav', '.tt-main-navigation', '.header_mobile'];
            const data = [];
            for (const sel of selectors) {
                document.querySelectorAll(sel).forEach(el => {
                    const cs = getComputedStyle(el);
                    data.push({
                        selector: sel,
                        text: (el as HTMLElement).innerText.slice(0, 80),
                        fontFamily: cs.fontFamily,
                        fontWeight: cs.fontWeight,
                        fontStyle: cs.fontStyle,
                        fontSize: cs.fontSize
                    });
                });
            }
            return data;
        });
        await fs.promises.writeFile(
            path.join(artifactsDir, `${baseName}_font-network.json`),
            JSON.stringify(fontNet, null, 2)
        );
        await fs.promises.writeFile(
            path.join(artifactsDir, `${baseName}_fonts-status.json`),
            JSON.stringify(fontStatus, null, 2)
        );
        await fs.promises.writeFile(
            path.join(artifactsDir, `${baseName}_computed-fonts.json`),
            JSON.stringify(computedSamples, null, 2)
        );
        await fs.promises.writeFile(
            path.join(artifactsDir, `${baseName}_content.html`),
            await page.content()
        );
        if (expectedFamilies.length) {
            const loadedFamilies = new Set(
                fontStatus.fontFaces.filter(f => f.status === 'loaded').map(f => f.family.replace(/['"]/g, '').toLowerCase())
            );
            
            // Get all unique fonts that are actually used on the page for the tested selectors
            const usedFamilies = new Set(
                computedSamples.map(s => s.fontFamily.split(',')[0].replace(/['"]/g, '').toLowerCase())
            );

            // We only care about expected fonts that are actually used on this page
            const expectedAndUsed = expectedFamilies
                .map(f => f.toLowerCase())
                .filter(f => usedFamilies.has(f));
            
            // Of those, find any that failed to load
            const missing = expectedAndUsed.filter(f => !loadedFamilies.has(f));

            if (missing.length) {
                const description = `Expected fonts are used but not loaded: ${missing.join(', ')}`;
                testInfo.annotations.push({ type: 'missing-fonts', description });
                throw new Error(description);
            }
        }
        await expect(page).toHaveScreenshot(`${templateFile}.png`, { animations: 'disabled', fullPage: true, maxDiffPixels: 100, timeout: 10000 });
        if (navigationError) {
            console.log(`(Non-fatal) navigation error recorded for ${templateFile}:`, navigationError);
        }
    });
    }
});
