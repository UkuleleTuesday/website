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

// Helper function to enable existing hover styles without creating new ones
async function enableExistingHoverStyles(page: any): Promise<void> {
    // Simply disable transitions for consistent screenshots - that's all we need
    await page.addStyleTag({
        content: `
            *, *::before, *::after {
                transition-duration: 0s !important;
                animation-duration: 0s !important;
                transition-delay: 0s !important;
                animation-delay: 0s !important;
            }
        `
    });
    
    // Use Playwright's built-in hover functionality on a key element to trigger one hover state
    // This will activate any CSS hover styles that exist without us defining new ones
    try {
        const primaryButton = page.locator('.rev-btn').first();
        if (await primaryButton.count() > 0) {
            await primaryButton.hover();
        }
    } catch (e) {
        // If hovering fails, continue - this is just to show one example of existing hover styles
    }
}

/**
 * Visual regression tests for hover states.
 * 
 * This test suite captures hover states by using Playwright's built-in hover functionality
 * on key interactive elements that have existing hover styles defined in the site's CSS.
 * 
 * The approach:
 * 1. Disables CSS transitions/animations for consistent screenshots
 * 2. Uses Playwright's .hover() method on elements with existing :hover styles
 * 3. Takes screenshots that show the actual site's hover states
 * 
 * Key elements tested:
 * - .rev-btn elements (e.g., "Book Us!" button) - shows white background/dark text on hover
 * - Links and buttons with existing CSS hover definitions
 * 
 * This ensures we test actual site behavior rather than creating artificial hover styles.
 */

// Default state tests
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
}

// Hover state tests
for (const templateFile of templateFiles) {
    test(`visual regression hover for ${templateFile}`, async ({ page }, testInfo) => {
        test.slow();
        try {
            await page.goto(templateFile, { waitUntil: 'networkidle', timeout: 10_000 });
        } catch (e) {
            // Ignore timeout errors and continue, as the page may have loaded enough for a snapshot.
            console.log(`Timeout waiting for network idle on ${templateFile}. Continuing with test.`);
        }
        await page.evaluate(() => document.fonts.ready);

        // Apply hover state to key interactive elements with existing hover styles
        await enableExistingHoverStyles(page);

        const artifactsDir = path.join(__dirname, '..', 'artifacts');
        // Sanitize the filename. Replaces invalid chars with _.
        const sanitizedTemplateFile = templateFile.replace(/[<>:"/\\|?*]/g, '_').replace(/ /g, '_');
        const artifactFilename = `page_render_hover_${sanitizedTemplateFile}`;
        await fs.promises.writeFile(path.join(artifactsDir, artifactFilename), await page.content());

        await expect(page).toHaveScreenshot(`${templateFile}-hover.png`, { animations: 'disabled', fullPage: true, maxDiffPixels: 100 , timeout: 10_000});
    });
}
