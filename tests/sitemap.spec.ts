import { test, expect } from '@playwright/test';
import { getAllHtmlFiles, templatesDir } from './utils/pages';

const baseUrl = process.env.BASE_URL || 'https://www.ukuleletuesday.ie';
const expectedPageUrls = getAllHtmlFiles(templatesDir)
    .sort()
    .map(templateFile => templateFile === 'index.html'
        ? `${baseUrl}/`
        : `${baseUrl}/${templateFile.replace(/\/index\.html$/, '/')}`);

test('robots.txt advertises the generated sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBeTruthy();
    await expect(response.text()).resolves.toContain(`Sitemap: ${baseUrl}/sitemaps/sitemap.xml`);
});

test('generated sitemap index lists only the page sitemap', async ({ request }) => {
    const response = await request.get('/sitemaps/sitemap.xml');
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    const locs = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, loc]) => loc);

    expect(body).not.toContain('xml-stylesheet');
    expect(body).not.toContain('/wp-content/');
    expect(locs).toEqual([`${baseUrl}/sitemaps/page-sitemap.xml`]);
});

test('generated page sitemap lists only live page URLs', async ({ request }) => {
    const response = await request.get('/sitemaps/page-sitemap.xml');
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    const locs = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, loc]) => loc);

    expect(body).not.toContain('xml-stylesheet');
    expect(body).not.toContain('/wp-content/');
    expect(body).not.toContain('/faq/');
    expect(locs).toEqual(expectedPageUrls);

    for (const url of expectedPageUrls) {
        const liveResponse = await request.get(new URL(url).pathname);
        expect(liveResponse.ok(), `${url} should return 200`).toBeTruthy();
    }
});
