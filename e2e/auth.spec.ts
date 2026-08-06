import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Click login button
    await page.getByRole('link', { name: /sign in/i }).first().click();
    
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Welcome Back');
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login');
    
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'Test1234!');
    
    // Blur email field to trigger validation
    await page.locator('input[type="email"]').blur();
    
    // Check for error message
    await expect(page.locator('text=valid email')).toBeVisible();
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.goto('/login');
    
    // Enter short password
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '123');
    
    // Blur password field
    await page.locator('input[type="password"]').blur();
    
    // Check for error message
    await expect(page.locator('text=at least 8 characters')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('Test1234!');
    
    // Initially password type
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click eye icon to show password
    await page.locator('button:has(svg)').first().click();
    
    // Should change to text type
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('link', { name: /sign up/i }).click();
    
    await expect(page).toHaveURL('/register');
    await expect(page.locator('h1')).toContainText('Create Account');
  });
});

test.describe('Registration Flow', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page.getByPlaceholder('John Doe')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••').first()).toBeVisible();
  });

  test('should validate name field', async ({ page }) => {
    await page.goto('/register');
    
    // Enter single character name
    await page.fill('input[placeholder="John Doe"]', 'A');
    await page.locator('input[placeholder="John Doe"]').blur();
    
    await expect(page.locator('text=at least 2 characters')).toBeVisible();
  });

  test('should show password strength meter', async ({ page }) => {
    await page.goto('/register');
    
    // Enter weak password
    await page.fill('input[type="password"]', 'password');
    
    // Check for strength indicator
    await expect(page.locator('text=Password Strength')).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    await page.goto('/register');
    
    // Fill passwords that don't match
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('Test1234!');
    await passwordInputs.nth(1).fill('Test5678!');
    await passwordInputs.nth(1).blur();
    
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should require terms acceptance', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form without accepting terms
    await page.fill('input[placeholder="John Doe"]', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.locator('input[type="password"]').first().fill('Test1234!');
    
    // Try to submit
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Should show error
    await expect(page.locator('text=accept the Terms')).toBeVisible();
  });
});
