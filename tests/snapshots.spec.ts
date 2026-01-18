import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { withAllHoverStates } from './hover-utils';
import { waitForFonts, setupFontNetworkLogging, gatherAndSaveDiagnostics, checkFonts } from './utils/fontDiagnostics';

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

async function setupPageForSnapshot(page: Page, templateFile: string): Promise<Error | null> {
    try {
        await page.goto(templateFile, { waitUntil: 'networkidle', timeout: 20000 });
        await page.addStyleTag({
            content: `
              .hide-in-snapshot-tests { visibility: hidden !important; }
              iframe[src*="youtube.com"]::before, iframe[src*="youtu.be"]::before, .vc_video-bg::before {
                content: 'Video Placeholder'; visibility: visible !important; position: absolute;
                top: 0; left: 0; width: 100%; height: 100%; display: flex;
                align-items: center; justify-content: center; background: #e0e0e0;
                color: #666; font-family: sans-serif; border: 2px dashed #999;
                box-sizing: border-box;
              }
            `
        });
        return null;
    } catch (e) {
        console.log(`Navigation issue on ${templateFile}: ${e}`);
        return e as Error;
    }
}

test.describe('Visual Regression Tests', () => {
    test.describe.configure({ mode: 'serial' });

    for (const templateFile of templateFiles) {
        test.describe(templateFile, () => {
            let navigationError: Error | null = null;

            test.beforeEach(async ({ page }) => {
                navigationError = await setupPageForSnapshot(page, templateFile);
            });

            test(`default state`, async ({ page }, testInfo) => {
                test.slow();
                const sanitizedTemplateFile = templateFile.replace(/[<>:"/\\|?*]/g, '_').replace(/ /g, '_');
                const baseName = sanitizedTemplateFile;

                await expect(page).toHaveScreenshot(`${templateFile}.png`, { animations: 'disabled', fullPage: true, maxDiffPixelRatio: 0.05, timeout: 10000, stylePath: path.join(__dirname, 'utils', 'hide-elements.css') });
                if (navigationError) {
                    console.log(`(Non-fatal) navigation error recorded for ${templateFile}:`, navigationError);
                }
            });

            test(`with hover states`, async ({ page }, testInfo) => {
                test.skip(testInfo.project.name.includes('Android') || testInfo.project.name.includes('iOS'), 'Hover states are not applicable on touch devices');
                test.slow();
                await waitForFonts(page);
                await withAllHoverStates(page, async () => {
                    await expect(page).toHaveScreenshot(`${templateFile}-hover.png`, {
                        animations: 'disabled',
                        fullPage: true,
                        maxDiffPixelRatio: 0.05,
                        timeout: 10000,
                        stylePath: path.join(__dirname, 'utils', 'hide-elements.css')
                    });
                });
            });
        });
    }
});
