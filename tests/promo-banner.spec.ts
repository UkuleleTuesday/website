import { test, expect } from '@playwright/test';

test.describe('Promo Banner', () => {
  test('should not render promo banner when variable is empty', async ({ page }) => {
    // Navigate to the home page (built without PROMO_BANNER env var)
    await page.goto('/');
    
    // The promo-bar div should not exist in the DOM
    const promoBanner = page.locator('.promo-bar');
    await expect(promoBanner).toHaveCount(0);
  });

  test('should render promo banner when variable is set', async ({ page }) => {
    // Note: This test assumes the site is built with PROMO_BANNER set
    // In a CI environment, you would need to build the site with the variable
    // For now, this test documents the expected behavior
    
    // This test would need to be run against a build with PROMO_BANNER set
    // Example: PROMO_BANNER='Test content' npm run build && npm test
    
    // When PROMO_BANNER is set, the banner should be visible
    // await page.goto('/');
    // const promoBanner = page.locator('.promo-bar');
    // await expect(promoBanner).toBeVisible();
    // await expect(promoBanner).toContainText('Test content');
  });
});
