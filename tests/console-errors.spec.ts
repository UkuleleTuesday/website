import { test, expect } from '@playwright/test';
import { getAllHtmlFiles, templatesDir } from './utils/pages';
import { collectConsoleProblems } from './utils/console';
import { blockOtherOrigins, stubNetlifyEndpoints } from './utils/network';

/**
 * Every page must load without errors in the browser console (issue #125):
 * no console.error output, no uncaught exceptions and no failed requests for
 * our own assets.
 *
 * Only our own code and assets are covered. Requests to other origins are
 * blocked so the test is hermetic, and the "Failed to load resource" errors
 * that blocking produces are ignored. What only Netlify provides (the Events
 * Calendar function, the Mixpanel proxy) is stubbed.
 */
test.describe('Browser console', () => {
  for (const templateFile of getAllHtmlFiles(templatesDir)) {
    test(`${templateFile} loads without console errors`, async ({ page, baseURL }) => {
      const origin = new URL(baseURL!).origin;
      await blockOtherOrigins(page, origin);
      await stubNetlifyEndpoints(page);
      const problems = collectConsoleProblems(page, origin);

      await page.goto(templateFile, { waitUntil: 'networkidle' });

      expect(problems).toEqual([]);
    });
  }
});
