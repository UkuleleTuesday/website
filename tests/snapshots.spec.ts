import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

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
        await page.goto(templateFile, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        const artifactsDir = path.join(__dirname, '..', 'artifacts');
        // Sanitize the title to create a valid filename. Replaces invalid chars with _.
        const sanitizedTitle = testInfo.title.replace(/[<>:"/\\|?*]/g, '_').replace(/ /g, '_');
        await fs.promises.writeFile(path.join(artifactsDir, `${sanitizedTitle}.html`), await page.content());

        await expect(page).toHaveScreenshot(`${templateFile}.png`, { animations: 'disabled', fullPage: true, maxDiffPixels: 100 });
    });
}
