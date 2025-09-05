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

const expectedFamilies = (process.env.EXPECT_FONTS || '').split(',').map(f => f.trim()).filter(Boolean);

test.beforeAll(async () => {
    if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
    }
});

for (const templateFile of templateFiles) {
    test(`visual regression for ${templateFile}`, async ({ page }, testInfo) => {
        test.slow();
        const sanitizedTemplateFile = templateFile.replace(/[<>:"/\\|?*]/g, '_').replace(/ /g, '_');
        const baseName = sanitizedTemplateFile;
        const fontNet = { requests: [] };
        setupFontNetworkLogging(page, fontNet);
        let navigationError = null;
        try {
            await page.goto(templateFile, { waitUntil: 'domcontentloaded', timeout: 10000 });
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
            const usedFamilies = new Set(
                computedSamples.map(s => s.fontFamily.split(',')[0].replace(/['"]/g, '').toLowerCase())
            );
            const missing = expectedFamilies.map(f => f.toLowerCase()).filter(f => !loadedFamilies.has(f) && !usedFamilies.has(f));
            if (missing.length) {
                testInfo.annotations.push({ type: 'missing-fonts', description: `Missing expected fonts: ${missing.join(', ')}` });
                throw new Error(`Expected fonts not loaded: ${missing.join(', ')}`);
            }
        }
        await expect(page).toHaveScreenshot(`${templateFile}.png`, { animations: 'disabled', fullPage: true, maxDiffPixels: 100, timeout: 10000 });
        if (navigationError) {
            console.log(`(Non-fatal) navigation error recorded for ${templateFile}:`, navigationError);
        }
    });
}
