import { test, expect } from '@playwright/test';

test.describe('Pricing Page', () => {
  test('should display all pricing tiers', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check for all three tiers
    await expect(page.locator('text=Starter')).toBeVisible();
    await expect(page.locator('text=Professional')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
  });

  test('should show monthly pricing', async ({ page }) => {
    await page.goto('/pricing');
    
    await expect(page.locator('text=$29')).toBeVisible();
    await expect(page.locator('text=$99')).toBeVisible();
  });

  test('should highlight recommended plan', async ({ page }) => {
    await page.goto('/pricing');
    
    // Professional plan should have "Most Popular" badge
    await expect(page.locator('text=Most Popular')).toBeVisible();
  });

  test('should have CTA buttons for each tier', async ({ page }) => {
    await page.goto('/pricing');
    
    const ctaButtons = page.locator('button:has-text("Get Started"), button:has-text("Contact Sales")');
    await expect(ctaButtons).toHaveCount(3);
  });
});

test.describe('Contact Page', () => {
  test('should display contact form', async ({ page }) => {
    await page.goto('/contact');
    
    await expect(page.getByPlaceholder('Your Name')).toBeVisible();
    await expect(page.getByPlaceholder('your.email@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Subject')).toBeVisible();
    await expect(page.getByPlaceholder('Your message...')).toBeVisible();
  });

  test('should display contact information', async ({ page }) => {
    await page.goto('/contact');
    
    await expect(page.locator('text=support@meetiva.ai')).toBeVisible();
    await expect(page.locator('text=+1 (555) 123-4567')).toBeVisible();
  });

  test('should validate email in contact form', async ({ page }) => {
    await page.goto('/contact');
    
    await page.fill('input[placeholder="Your Name"]', 'Test User');
    await page.fill('input[placeholder="your.email@example.com"]', 'invalid-email');
    
    // Try to submit
    await page.getByRole('button', { name: /send message/i }).click();
    
    // Should prevent submission or show error
    await expect(page).toHaveURL('/contact');
  });
});

test.describe('Legal Pages', () => {
  test('should navigate to Terms page', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: /terms/i }).first().click();
    
    await expect(page).toHaveURL('/terms');
    await expect(page.locator('h1')).toContainText('Terms of Service');
  });

  test('should navigate to Privacy page', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: /privacy/i }).first().click();
    
    await expect(page).toHaveURL('/privacy');
    await expect(page.locator('h1')).toContainText('Privacy Policy');
  });

  test('should display last updated date', async ({ page }) => {
    await page.goto('/privacy');
    
    await expect(page.locator('text=Last updated')).toBeVisible();
  });
});
