import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Click login button
    await page.getByRole('link', { name: /login/i }).first().click();
    
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h2')).toContainText('Sign in');
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
    
    await page.getByRole('link', { name: /create an account/i }).click();
    
    await expect(page).toHaveURL('/register');
    await expect(page.locator('h2')).toContainText('Create your account');
  });
});

test.describe('Registration Flow', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page.getByPlaceholder('Your name')).toBeVisible();
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible();
    await expect(page.getByPlaceholder('Minimum 8 characters')).toBeVisible();
  });

  test('should require all fields', async ({ page }) => {
    await page.goto('/register');
    
    // Submit empty form
    await page.getByRole('button', { name: /create workspace/i }).click();
    
    // Should show validation error
    await expect(page.locator('text=All fields are required')).toBeVisible();
  });

  test('should validate minimum password length', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form with short password
    await page.fill('input[placeholder="Your name"]', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '123');
    
    // Submit
    await page.getByRole('button', { name: /create workspace/i }).click();
    
    // Check for validation error
    await expect(page.locator('text=at least 8 characters')).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    await page.goto('/register');
    
    // Fill passwords that don't match
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('Test1234!');
    await passwordInputs.nth(1).fill('Test5678!');
    await page.getByRole('button', { name: /create workspace/i }).click();
    
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });
});
