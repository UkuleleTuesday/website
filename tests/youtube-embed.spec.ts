import { test, expect } from '@playwright/test';

/**
 * YouTube embeds (issue #125): the Concerts videos are click-to-load facades
 * rendered by the youtube_video macro, and every player that does get created
 * uses the privacy-enhanced youtube-nocookie.com domain.
 */
test.describe('YouTube embeds', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Nothing from YouTube is needed for these checks; keep the test hermetic.
    const origin = new URL(baseURL!).origin;
    await page.route((address) => address.origin !== origin, (route) => route.abort('blockedbyclient'));
  });

  test('Concerts videos load the player only when clicked', async ({ page }) => {
    await page.goto('/concerts/');

    const facades = page.locator('.youtube-facade');
    await expect(facades).toHaveCount(4);
    await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0);

    const featured = facades.first();
    const title = 'Ukulele Tuesday playing Dreams live with Daniel Ho at Monopolele 2026';
    const playLink = featured.getByRole('link', { name: `Play video: ${title}` });
    // Without JavaScript the play button is a plain link to the video.
    await expect(playLink).toHaveAttribute('href', 'https://www.youtube.com/watch?v=t7B2ez6Uodk');
    await expect(featured.locator('img')).toHaveAttribute('src', 'https://i.ytimg.com/vi/t7B2ez6Uodk/hqdefault.jpg');

    await playLink.click();

    const player = featured.locator('iframe');
    await expect(player).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/t7B2ez6Uodk?autoplay=1');
    await expect(player).toHaveAttribute('title', title);
    await expect(player).toHaveAttribute('allow', /autoplay/);
    await expect(player).toHaveAttribute('allowfullscreen', '');
    await expect(playLink).toHaveCount(0);

    // The other three videos are still facades.
    await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(1);
    await expect(page.locator('.youtube-facade__link')).toHaveCount(3);
  });

  test('the play-along session video uses the privacy-enhanced player', async ({ page }) => {
    await page.goto('/tuesday-session/');

    const player = page.locator('.youtube-embed iframe');
    await expect(player).toHaveCount(1);
    await expect(player).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\//);
  });
});
