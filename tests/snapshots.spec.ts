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

// Helper function to inject hover CSS
function getHoverCSS(): string {
    return `
        /* Disable transitions for consistent screenshots */
        * {
            transition: none !important;
            animation: none !important;
        }
        
        /* Rev-btn hover (matches actual site CSS) */
        .rev-btn {
            background-color: #ffffff !important;
            color: #0d0d0d !important;
        }
        
        /* Navigation menu hovers */
        .main-menu a,
        .mobile-menu a,
        .menu-item a {
            color: #efa537 !important;
            text-decoration: underline !important;
        }
        
        /* Social icon hovers */
        .cesis_social_icons a,
        .fa {
            color: #efa537 !important;
            transform: scale(1.1) !important;
        }
        
        /* Button hovers */
        input[type="submit"],
        input[type="button"],
        button,
        .cesis_menu_btn a,
        .cesis_mobile_btn a {
            background-color: rgba(255, 255, 255, 0.2) !important;
            opacity: 0.8 !important;
        }
        
        /* General link hovers */
        a:not(.rev-btn):not(.fa):not(.no-hover) {
            color: #efa537 !important;
            text-decoration: underline !important;
        }
        
        /* Spotify/YouTube buttons in concerts page */
        .cesis_button_text {
            opacity: 0.8 !important;
        }
        
        /* Make sure hamburger menu shows hover state */
        .cesis_mobile_menu_switch {
            opacity: 0.8 !important;
        }
        
        /* Contact form specific hover states */
        .wpcf7-form-control.wpcf7-submit {
            background-color: rgba(239, 165, 55, 0.8) !important;
            transform: scale(1.02) !important;
        }
        
        /* Additional hover states for specific components */
        .wpb_wrapper a,
        .entry-content a {
            color: #efa537 !important;
            text-decoration: underline !important;
        }
    `;
}

/**
 * Interactive components covered by hover state tests:
 * 
 * Header components:
 * - Main navigation menu links (Concerts, Jam Session, Songbook, Press, Support Us)
 * - Mobile navigation menu links
 * - Social media icons (Instagram, Facebook, WhatsApp, TripAdvisor, YouTube)
 * - "Book Us!" button in header
 * - Mobile hamburger menu button
 * - Logo link
 * 
 * Page-specific components:
 * - Homepage: "View Songbook" and "Get In Touch" buttons in hero section
 * - Concerts: Spotify and YouTube buttons
 * - Contact: Contact form submit button
 * - All pages: Text links within content areas
 * 
 * Component limitations:
 * - Dynamic hover effects that depend on JavaScript are simplified to CSS-only states
 * - Some legacy carousel/slider components may not show perfect hover states
 * - Dropdown menus are captured in closed state (hover forces styling but not open state)
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

        // Inject hover CSS to force all interactive elements into hover state
        await page.addStyleTag({ content: getHoverCSS() });

        const artifactsDir = path.join(__dirname, '..', 'artifacts');
        // Sanitize the filename. Replaces invalid chars with _.
        const sanitizedTemplateFile = templateFile.replace(/[<>:"/\\|?*]/g, '_').replace(/ /g, '_');
        const artifactFilename = `page_render_hover_${sanitizedTemplateFile}`;
        await fs.promises.writeFile(path.join(artifactsDir, artifactFilename), await page.content());

        await expect(page).toHaveScreenshot(`${templateFile}-hover.png`, { animations: 'disabled', fullPage: true, maxDiffPixels: 100 , timeout: 10_000});
    });
}
