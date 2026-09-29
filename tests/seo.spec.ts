import { test, expect } from '@playwright/test';
import { getAllHtmlFiles, templatesDir } from './utils/pages';

const templateFiles = getAllHtmlFiles(templatesDir);
const baseUrl = process.env.BASE_URL || 'https://www.ukuleletuesday.ie';

// Define expected breadcrumbs for each page to verify against.
// This logic mirrors the `generate_breadcrumbs` function in `build.py`.
const expectedBreadcrumbs = {
    'index.html': [{ name: 'Home', url: '/' }],
    'code-of-conduct/index.html': [{ name: 'Home', url: '/' }, { name: 'Code Of Conduct', url: '/code-of-conduct/' }],
    'book-us/index.html': [{ name: 'Home', url: '/' }, { name: 'Book Us', url: '/book-us/' }],
    'contact-us/index.html': [{ name: 'Home', url: '/' }, { name: 'Contact Us', url: '/contact-us/' }],
    'songbook/index.html': [{ name: 'Home', url: '/' }, { name: 'Songbook', url: '/songbook/' }],
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

        test('should link the social profiles from the Organization', () => {
            const organization = jsonLdContent['@graph'].find(item => item['@type'] === 'Organization');
            expect(organization, 'Organization schema should exist.').toBeDefined();
            expect(organization.sameAs).toEqual(expect.arrayContaining([
                'https://www.instagram.com/ukuleletuesday/',
                'https://www.facebook.com/UkuleleTuesday',
                'https://www.youtube.com/c/UkuleleTuesday',
                'https://open.spotify.com/artist/1I58ohDDrb0BK55KuVvtjM',
                'https://www.tripadvisor.com/Attraction_Review-g186605-d25399502-Reviews-Ukulele_Tuesday-Dublin_County_Dublin.html',
            ]));
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

        test('should carry the MusicGroup schema on the Book Us page only', () => {
            const band = jsonLdContent['@graph'].find(item => item['@type'] === 'MusicGroup');
            if (templateFile !== 'book-us/index.html') {
                expect(band, 'Only the Book Us page describes the band.').toBeUndefined();
                return;
            }
            expect(band, 'The Book Us page should describe the band.').toBeDefined();
            expect(band['@id']).toBe(`${baseUrl}/#band`);
            expect(band.name).toBe('Ukulele Tuesday');
            expect(band.url).toBe(`${baseUrl}/book-us/`);
            expect(band.parentOrganization).toEqual({ '@id': `${baseUrl}/#organization` });
            // The band links the same profiles as the Organization (one list, in _macros/social-icons.html).
            const organization = jsonLdContent['@graph'].find(item => item['@type'] === 'Organization');
            expect(band.sameAs).toEqual(organization.sameAs);
            expect(band.sameAs).toContain('https://open.spotify.com/artist/1I58ohDDrb0BK55KuVvtjM');
        });
    });
}
