import { test, expect } from '@playwright/test';
import { collectConsoleProblems } from './utils/console';

/**
 * The Mixpanel SDK is self-hosted (static/js/vendor/) and reached through the
 * same-origin /mp/* proxy defined in netlify.toml, so tracking protection has
 * nothing to block and the console stays clean (issue #125).
 *
 * Production builds include /js/mixpanel.js in every page; the build under
 * test (ENABLE_ANALYTICS unset) does not, so the module is loaded here the
 * same way base.html does and its first tracking request is inspected.
 */
test('the analytics module loads from our origin and only talks to the /mp proxy', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;

  const mixpanelRequests: string[] = [];
  page.on('request', (request) => {
    if (/(^|\.)(mixpanel\.com|mxpnl\.com)$/.test(new URL(request.url()).hostname)) mixpanelRequests.push(request.url());
  });
  await page.route((address) => address.origin !== origin, (route) => route.abort('blockedbyclient'));
  await page.route('**/.netlify/functions/**', (route) => route.fulfill({ json: { items: [] } }));

  // Netlify applies the /mp/* proxy rule; the static test server does not.
  const proxiedRequests: string[] = [];
  await page.route('**/mp/**', (route) => {
    proxiedRequests.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'text/plain', body: '1' });
  });

  const problems = collectConsoleProblems(page, origin);

  await page.goto('/');
  await page.addScriptTag({ type: 'module', url: '/js/mixpanel.js' });

  await expect
    .poll(() => proxiedRequests.length, { message: 'expected the page view to be sent to /mp/track/', timeout: 15_000 })
    .toBeGreaterThan(0);
  expect(proxiedRequests[0]).toMatch(new RegExp(`^${origin}/mp/track/\\?`));
  expect(mixpanelRequests).toEqual([]);
  expect(problems).toEqual([]);
});
