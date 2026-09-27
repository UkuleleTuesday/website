import { test, expect } from '@playwright/test';
import { getAllPageUrls } from './utils/pages';
import { collectConsoleProblems } from './utils/console';

/**
 * Every page must load without errors in the browser console (issue #125):
 * no console.error output, no uncaught exceptions and no failed requests for
 * our own assets.
 *
 * Only our own code and assets are covered. Requests to other origins
 * (YouTube, Spotify, Google Maps and Fonts, ...) are blocked so the test is
 * hermetic, and the "Failed to load resource" errors that blocking produces
 * are ignored. The Events Calendar's Netlify function and the /mp/* analytics
 * proxy are stubbed because the static test server runs neither.
 */
test.describe('Browser console', () => {
  for (const url of getAllPageUrls()) {
    test(`${url} loads without console errors`, async ({ page, baseURL }) => {
      const origin = new URL(baseURL!).origin;
      await page.route((address) => address.origin !== origin, (route) => route.abort('blockedbyclient'));
      await page.route('**/.netlify/functions/**', (route) => route.fulfill({ json: { items: [] } }));
      await page.route('**/mp/**', (route) => route.fulfill({ status: 200, contentType: 'text/plain', body: '1' }));

      const problems = collectConsoleProblems(page, origin);

      await page.goto(url, { waitUntil: 'networkidle' });

      expect(problems).toEqual([]);
    });
  }
});
