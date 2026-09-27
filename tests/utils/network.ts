import { Page } from '@playwright/test';

/**
 * Aborts every request to another origin (YouTube, Spotify, Google Fonts and
 * Maps, ...) so a test depends only on our own build.
 */
export async function blockOtherOrigins(page: Page, origin: string): Promise<void> {
  await page.route((url) => url.origin !== origin, (route) => route.abort('blockedbyclient'));
}

/**
 * Stands in for what only Netlify provides and the static test server does
 * not: the Events Calendar function and the Mixpanel proxies from
 * netlify.toml (/mp-lib/* for the SDK, /mp/* for the tracking API). The SDK
 * is served from the mixpanel-browser package so that a production-like build
 * (ENABLE_ANALYTICS=true) runs the real library.
 */
export async function stubNetlifyEndpoints(page: Page): Promise<void> {
  await page.route('**/.netlify/functions/**', (route) => route.fulfill({ json: { items: [] } }));
  await page.route('**/mp-lib/mixpanel-2-latest.min.js', (route) =>
    route.fulfill({ path: require.resolve('mixpanel-browser/dist/mixpanel.min.js') }),
  );
  await page.route('**/mp/**', (route) => route.fulfill({ status: 200, contentType: 'text/plain', body: '1' }));
}
