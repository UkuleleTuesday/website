import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const templatesDir = path.join(__dirname, '..', 'templates');

// Utility function to recursively find all HTML files in a directory, excluding partials.
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
const baseUrl = process.env.BASE_URL || 'https://ukuleletuesday.ie';

// Define expected breadcrumbs for each page to verify against.
// This logic mirrors the `generate_breadcrumbs` function in `build.py`.
const expectedBreadcrumbs = {
    'index.html': [{ name: 'Home', url: '/' }],
    'about/index.html': [{ name: 'Home', url: '/' }, { name: 'About', url: '/about/' }],
    'code-of-conduct/index.html': [{ name: 'Home', url: '/' }, { name: 'Code Of Conduct', url: '/code-of-conduct/' }],
    'concerts/index.html': [{ name: 'Home', url: '/' }, { name: 'Concerts', url: '/concerts/' }],
    'contact-us/index.html': [{ name: 'Home', url: '/' }, { name: 'Contact Us', url: '/contact-us/' }],
    'faq/index.html': [{ name: 'Home', url: '/' }, { name: 'Faq', url: '/faq/' }],
    'songbook/index.html': [{ name: 'Home', url: '/' }, { name: 'Songbook', url: '/songbook/' }],
    'testimonials/index.html': [{ name: 'Home', url: '/' }, { name: 'Testimonials', url: '/testimonials/' }],
    'tuesday-session/index.html': [{ name: 'Home', url: '/' }, { name: 'Tuesday Session', url: '/tuesday-session/' }],
    'whatsapp/index.html': [{ name: 'Home', url: '/' }, { name: 'Whatsapp', url: '/whatsapp/' }],
};

for (const templateFile of templateFiles) {
    test.describe(`SEO tests for ${templateFile}`, () => {
        let jsonLdContent: any;

        test.beforeEach(async ({ page }) => {
            await page.goto(templateFile, { waitUntil: 'domcontentloaded' });
            
            // 1. Verify the old Yoast schema is gone.
            await expect(page.locator('script.yoast-schema-graph')).toHaveCount(0);

            // 2. Find and parse the new JSON-LD schema.
            const jsonLdElement = page.locator('script[type="application/ld+json"]');
            await expect(jsonLdElement).toHaveCount(1, 'Expected one JSON-LD script tag per page.');
            
            const rawContent = await jsonLdElement.textContent();
            expect(rawContent, 'JSON-LD script should not be empty.').not.toBeNull();

            try {
                jsonLdContent = JSON.parse(rawContent!);
            } catch (e) {
                test.fail(true, `Failed to parse JSON-LD: ${e.message}`);
            }
        });

        test('should contain valid BreadcrumbList schema', () => {
            const breadcrumbList = jsonLdContent['@graph'].find(item => item['@type'] === 'BreadcrumbList');
            expect(breadcrumbList, 'BreadcrumbList schema should exist.').toBeDefined();
            
            const actualCrumbs = breadcrumbList.itemListElement.map(item => ({
                name: item.name,
                url: new URL(item.item).pathname, // Compare pathnames to ignore domain differences.
            }));
            
            const expectedCrumbs = expectedBreadcrumbs[templateFile];
            expect(actualCrumbs).toEqual(expectedCrumbs);
        });

        test('should use absolute URLs for all IDs and URLs in the schema', () => {
            const graph = jsonLdContent['@graph'];
            expect(Array.isArray(graph)).toBe(true);

            graph.forEach(item => {
                const urlRegex = new RegExp(`^${baseUrl}`);

                // Check `@id` fields
                if (item['@id']) {
                    expect(item['@id']).toMatch(urlRegex);
                }
                // Check `url` fields
                if (item.url) {
                    if (typeof item.url === 'string') {
                        expect(item.url).toMatch(urlRegex);
                    } else if (typeof item.url === 'object' && item.url.url) {
                         // Handles cases like the logo object
                        expect(item.url.url).toMatch(urlRegex);
                    }
                }
                // Check `item` in BreadcrumbList
                if (item.itemListElement) {
                    item.itemListElement.forEach(crumb => {
                        expect(crumb.item).toMatch(urlRegex);
                    });
                }
            });
        });
    });
}
