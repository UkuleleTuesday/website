import { test, expect } from '@playwright/test';
import { blockOtherOrigins } from './utils/network';

/**
 * YouTube embeds (issue #125): the Book Us videos are lite-youtube-embed
 * players rendered by the youtube_video macro, which load nothing from YouTube
 * until the visitor presses play, and every player that does get created uses
 * the privacy-enhanced youtube-nocookie.com domain.
 */
const FEATURED = {
  id: 't7B2ez6Uodk',
  label: 'Play video: Ukulele Tuesday playing Dreams live with Daniel Ho at Monopolele 2026',
};

test.describe('YouTube embeds', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Nothing from YouTube is needed for these checks; keep the tests hermetic.
    await blockOtherOrigins(page, new URL(baseURL!).origin);
  });

  test('Book Us videos are lite-youtube-embed players that load nothing from YouTube', async ({ page }) => {
    await page.goto('/book-us/');

    const players = page.locator('lite-youtube');
    await expect(players).toHaveCount(1);
    await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0);

    const featured = players.first();
    await expect(featured).toHaveAttribute('videoid', FEATURED.id);
    await expect(featured).toHaveAttribute('style', /i\.ytimg\.com\/vi\/t7B2ez6Uodk\/hqdefault\.jpg/);
    // lite-yt-embed.js upgrades the fallback link into a button.
    await expect(featured.getByRole('button', { name: FEATURED.label })).toBeVisible();
  });

  test('pressing play creates the player on youtube-nocookie.com', async ({ page, isMobile }) => {
    // On mobile user agents lite-youtube-embed uses YouTube's IFrame API from
    // www.youtube.com instead, which is blocked here.
    test.skip(isMobile, 'lite-youtube-embed loads the YouTube IFrame API on mobile user agents');
    await page.goto('/book-us/');

    const featured = page.locator('lite-youtube').first();
    await featured.getByRole('button', { name: FEATURED.label }).click();
    await expect(featured).toHaveClass(/lyt-activated/);

    const player = featured.locator('iframe');
    await expect(player).toHaveAttribute('src', `https://www.youtube-nocookie.com/embed/${FEATURED.id}?autoplay=1&playsinline=1`);
    await expect(player).toHaveAttribute('title', FEATURED.label);
    await expect(player).toHaveAttribute('allow', /autoplay/);
    await expect(player).toHaveAttribute('allowfullscreen', '');
    // The other video is untouched.
    await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(1);
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('the play button is a link to the video on YouTube', async ({ page }) => {
      await page.goto('/book-us/');
      const link = page.locator('lite-youtube').first().getByRole('link', { name: FEATURED.label });
      await expect(link).toHaveAttribute('href', `https://www.youtube.com/watch?v=${FEATURED.id}`);
    });
  });

  test('the play-along session video uses the privacy-enhanced player', async ({ page }) => {
    await page.goto('/tuesday-session/');

    const player = page.locator('.youtube-embed iframe');
    await expect(player).toHaveCount(1);
    await expect(player).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\//);
  });
});
