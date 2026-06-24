import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load landing page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check for main heading
    await expect(page.locator('h1')).toContainText('Meetings become');
    
    // Check for CTA buttons
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  });

  test('should navigate to pricing page', async ({ page }) => {
    await page.goto('/');
    
    // Click pricing link in navigation
    await page.getByRole('link', { name: /pricing/i }).first().click();
    
    await expect(page).toHaveURL('/pricing');
    await expect(page.locator('h1')).toContainText('Plans built for premium meeting momentum');
  });

  test('should navigate to contact page', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: /contact/i }).first().click();
    
    await expect(page).toHaveURL('/contact');
    await expect(page.locator('h1')).toContainText('Get in Touch');
  });

  test('should have working pricing section', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to pricing section
    await page.locator('text=Pricing').first().click();
    
    // Check pricing section heading
    await expect(page.locator('text=Simple plans for teams that move fast')).toBeVisible();
  });
});
