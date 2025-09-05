import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { withAllHoverStates } from './hover-utils';

const templatesDir = path.join(__dirname, '..', 'templates');
const publicDir = path.join(__dirname, '..', 'public');

function getAllHtmlFiles(dirPath: string, arrayOfFiles: string[] = [], relativeDir: string = ''): string[] {
    const files = fs.readdirSync(dirPath);

    files.forEach(function (file) {
        const currentRelativePath = path.join(relativeDir, file);

        if (file.startsWith('_') || file.startsWith('.')) {
            return;
        }
        
        const fullPath = path.join(dirPath, file);

        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllHtmlFiles(fullPath, arrayOfFiles, currentRelativePath);
        } else if (file.endsWith('.html')) {
            arrayOfFiles.push(currentRelativePath);
        }
    });

    return arrayOfFiles;
}

const templateFiles = getAllHtmlFiles(templatesDir);

test.beforeAll(async () => {
    const artifactsDir = path.join(__dirname, '..', 'artifacts');
    if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
    }
});

for (const templateFile of templateFiles) {
    test(`visual regression for ${templateFile}`, async ({ page }, testInfo) => {
        test.slow();
        try {
            await page.goto(templateFile, { waitUntil: 'networkidle', timeout: 10_000 });
        } catch (e) {
            // Ignore timeout errors and continue, as the page may have loaded enough for a snapshot.
            console.log(`Timeout waiting for network idle on ${templateFile}. Continuing with test.`);
        }
        await page.evaluate(() => document.fonts.ready);

        const artifactsDir = path.join(__dirname, '..', 'artifacts');
        // Sanitize the filename. Replaces invalid chars with _.
        const sanitizedTemplateFile = templateFile.replace(/[<>:"/\\|?*]/g, '_').replace(/ /g, '_');
        const artifactFilename = `page_render_${sanitizedTemplateFile}`;
        await fs.promises.writeFile(path.join(artifactsDir, artifactFilename), await page.content());

        await expect(page).toHaveScreenshot(`${templateFile}.png`, { animations: 'disabled', fullPage: true, maxDiffPixels: 100 , timeout: 10_000});
    });

    test(`visual regression for ${templateFile} (with hover states)`, async ({ page }, testInfo) => {
        test.slow();
        try {
            await page.goto(templateFile, { waitUntil: 'networkidle', timeout: 10_000 });
        } catch (e) {
            // Ignore timeout errors and continue, as the page may have loaded enough for a snapshot.
            console.log(`Timeout waiting for network idle on ${templateFile}. Continuing with test.`);
        }
        await page.evaluate(() => document.fonts.ready);

        // Use the utility function to force all hover states
        await withAllHoverStates(page, async () => {
            await expect(page).toHaveScreenshot(`${templateFile}-hover.png`, { 
                animations: 'disabled', 
                fullPage: true, 
                maxDiffPixels: 25000, // Higher threshold for hover states due to more visual changes
                timeout: 10_000 
            });
        });
    });
}
