import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load landing page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check for main heading
    await expect(page.locator('h1')).toContainText('Transform Your Meetings');
    
    // Check for CTA buttons
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  });

  test('should navigate to pricing page', async ({ page }) => {
    await page.goto('/');
    
    // Click pricing link in navigation
    await page.getByRole('link', { name: /pricing/i }).first().click();
    
    await expect(page).toHaveURL('/pricing');
    await expect(page.locator('h1')).toContainText('Simple, Transparent Pricing');
  });

  test('should navigate to contact page', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: /contact/i }).first().click();
    
    await expect(page).toHaveURL('/contact');
    await expect(page.locator('h1')).toContainText('Get in Touch');
  });

  test('should have working FAQ accordion', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to FAQ section
    await page.locator('text=Frequently Asked Questions').scrollIntoViewIfNeeded();
    
    // Click first FAQ item
    const firstFaq = page.locator('button:has-text("What is Meetiva.ai?")').first();
    await firstFaq.click();
    
    // Check if content expands
    await expect(page.locator('text=AI-powered meeting intelligence platform')).toBeVisible();
  });
});
