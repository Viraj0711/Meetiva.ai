import { test, expect } from '@playwright/test';

test.describe('Pricing Page', () => {
  test('should display all pricing tiers', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check for all three tiers
    await expect(page.getByRole('heading', { name: 'Starter' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Growth' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Enterprise' })).toBeVisible();
  });

  test('should show monthly pricing', async ({ page }) => {
    await page.goto('/pricing');
    
    await expect(page.locator('text=$29')).toBeVisible();
    await expect(page.locator('text=$59')).toBeVisible();
  });

  test('should highlight recommended plan', async ({ page }) => {
    await page.goto('/pricing');
    
    // Professional plan should have "Most Popular" badge
    await expect(page.locator('text=Most Popular')).toBeVisible();
  });

  test('should have CTA buttons for each tier', async ({ page }) => {
    await page.goto('/pricing');
    
    // Each pricing card has exactly one CTA link with unique text
    await expect(page.getByRole('link', { name: /start free$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /start with growth/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /talk to sales/i })).toBeVisible();
  });
});

test.describe('Contact Page', () => {
  test('should display contact form', async ({ page }) => {
    await page.goto('/contact');
    
    await expect(page.getByPlaceholder('Your name')).toBeVisible();
    await expect(page.getByPlaceholder('your.email@company.com')).toBeVisible();
    await expect(page.getByPlaceholder('How can we help?')).toBeVisible();
    await expect(page.getByPlaceholder('Tell us more about your needs...')).toBeVisible();
  });

  test('should display contact information', async ({ page }) => {
    await page.goto('/contact');
    
    await expect(page.locator('text=support@meetiva.ai')).toBeVisible();
    await expect(page.locator('text=+1 (555) 123-4567')).toBeVisible();
  });

  test('should validate email in contact form', async ({ page }) => {
    await page.goto('/contact');
    
    await page.fill('input[placeholder="Your name"]', 'Test User');
    await page.fill('input[placeholder="your.email@company.com"]', 'invalid-email');
    
    // Try to submit
    await page.getByRole('button', { name: /send message/i }).click();
    
    // Should prevent submission or show error
    await expect(page).toHaveURL('/contact');
  });
});

test.describe('Legal Pages', () => {
  test('should navigate to Terms page', async ({ page }) => {
    await page.goto('/terms');
    
    await expect(page).toHaveURL('/terms');
    await expect(page.locator('h1')).toContainText('Terms that match the product');
  });

  test('should navigate to Privacy page', async ({ page }) => {
    await page.goto('/privacy');
    
    await expect(page).toHaveURL('/privacy');
    await expect(page.locator('h1')).toContainText('Privacy built for a product');
  });

  test('should display last updated date', async ({ page }) => {
    await page.goto('/privacy');
    
    await expect(page.locator('text=Last updated')).toBeVisible();
  });

  test('should navigate to 404 for unknown routes', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Should show 404 page
    await expect(page.locator('text=404')).toBeVisible();
  });
});
