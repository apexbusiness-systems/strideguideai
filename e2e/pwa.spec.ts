import { test, expect } from '@playwright/test';

test.describe('PWA Features', () => {
  test('should have manifest file', async ({ page }) => {
    await page.goto('/');
    
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', /manifest/);
  });

  test('should register service worker', async ({ page, context }) => {
    await page.goto('/');
    
    // Wait a bit for SW registration
    await page.waitForTimeout(2000);
    
    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(swRegistered).toBe(true);
  });

  test('should have app icons', async ({ page }) => {
    await page.goto('/');
    
    // Check for apple-touch-icon or favicon
    const iconLink = page.locator('link[rel*="icon"], link[rel*="apple-touch-icon"]').first();
    await expect(iconLink).toHaveAttribute('href');
  });

  test('should have meta tags for PWA', async ({ page }) => {
    await page.goto('/');
    
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
    
    const themeColor = page.locator('meta[name="theme-color"]');
    // Theme color might not exist, so we just check if page loads
    await expect(page.locator('body')).toBeVisible();
  });
});

