import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation', () => {
  test('mobile menu should be hidden on desktop', async ({ page }) => {
    await page.goto('/');
    
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Mobile menu button should not be visible on desktop
    const hamburger = page.locator('.cesis_mobile_menu_switch');
    await expect(hamburger).not.toBeVisible();
    
    // Desktop navigation should be visible
    const desktopNav = page.locator('.tt-main-navigation');
    await expect(desktopNav).toBeVisible();
    
    // Check that all navigation links are visible in the main navigation
    const mainNav = page.locator('.tt-main-navigation');
    await expect(mainNav.getByRole('link', { name: 'Concerts' })).toBeVisible();
    await expect(mainNav.getByRole('link', { name: 'Jam Session' })).toBeVisible();
    await expect(mainNav.getByRole('link', { name: 'Songbook' })).toBeVisible();
    await expect(mainNav.getByRole('link', { name: 'Press' })).toBeVisible();
    await expect(mainNav.getByRole('link', { name: 'Support Us' })).toBeVisible();
  });

  test('mobile menu should work on mobile viewport', async ({ page }) => {
    await page.goto('/');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mobile menu button should be visible on mobile
    const hamburger = page.locator('.cesis_mobile_menu_switch');
    await expect(hamburger).toBeVisible();
    
    // Mobile menu should be initially hidden
    const mobileMenu = page.locator('.header_mobile');
    await expect(mobileMenu).not.toBeVisible();
    
    // Click hamburger button to open mobile menu
    await hamburger.click();
    
    // Mobile menu should now be visible
    await expect(mobileMenu).toBeVisible();
    
    // Check that all navigation links are accessible in mobile menu
    await expect(mobileMenu.getByRole('link', { name: 'Concerts' })).toBeVisible();
    await expect(mobileMenu.getByRole('link', { name: 'Jam Session' })).toBeVisible();
    await expect(mobileMenu.getByRole('link', { name: 'Songbook' })).toBeVisible();
    await expect(mobileMenu.getByRole('link', { name: 'Press' })).toBeVisible();
    await expect(mobileMenu.getByRole('link', { name: 'Support Us' })).toBeVisible();
    
    // Hamburger should have 'open' class when menu is open
    await expect(hamburger).toHaveClass(/open/);
  });

  test('mobile menu should close when clicking navigation link', async ({ page }) => {
    await page.goto('/');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const hamburger = page.locator('.cesis_mobile_menu_switch');
    const mobileMenu = page.locator('.header_mobile');
    
    // Open mobile menu
    await hamburger.click();
    await expect(mobileMenu).toBeVisible();
    
    // Click on a navigation link
    await mobileMenu.getByRole('link', { name: 'Concerts' }).click();
    
    // Should navigate to concerts page
    await expect(page).toHaveURL('/concerts/');
    
    // Mobile menu should be closed after navigation (check after page loads)
    await page.waitForLoadState();
    await expect(page.locator('.header_mobile')).not.toBeVisible();
  });

  test('mobile menu hamburger animation works', async ({ page }) => {
    await page.goto('/');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const hamburger = page.locator('.cesis_mobile_menu_switch');
    
    // Initially should not have 'open' class
    await expect(hamburger).not.toHaveClass(/open/);
    
    // Click to open
    await hamburger.click();
    await expect(hamburger).toHaveClass(/open/);
    
    // Click to close
    await hamburger.click();
    await expect(hamburger).not.toHaveClass(/open/);
  });
});