import { test, expect } from '@playwright/test';
import { collectConsoleProblems } from './utils/console';
import { blockOtherOrigins, stubNetlifyEndpoints } from './utils/network';

/**
 * Mixpanel is loaded through its official snippet with the SDK and the
 * tracking API proxied through our own origin (see static/js/mixpanel.js and
 * netlify.toml), so tracking protection has nothing to block and the console
 * stays clean (issue #125).
 *
 * Production builds include /js/mixpanel.js in every page; a build with
 * ENABLE_ANALYTICS unset does not, so the script is added here the same way
 * base.html does (unless the page already has it) and its requests are
 * inspected.
 */
test('Mixpanel loads through our origin and only talks to the Netlify proxies', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await blockOtherOrigins(page, origin);
  await stubNetlifyEndpoints(page);
  const problems = collectConsoleProblems(page, origin);

  await page.goto('/');
  if ((await page.locator('script[src="/js/mixpanel.js"]').count()) === 0) {
    await page.addScriptTag({ url: '/js/mixpanel.js' });
  }

  // The SDK batches events; the page view is flushed within a few seconds.
  await expect
    .poll(() => requests.find((url) => url.includes('/mp/track/')), { timeout: 15_000 })
    .toMatch(new RegExp(`^${origin}/mp/track/\\?`));
  expect(requests).toContain(`${origin}/mp-lib/mixpanel-2-latest.min.js`);
  expect(requests.filter((url) => /(^|\.)(mixpanel\.com|mxpnl\.com)$/.test(new URL(url).hostname))).toEqual([]);
  expect(problems).toEqual([]);
});
