import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Click login button
    await page.getByRole('link', { name: /login/i }).first().click();
    
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('#login-email');
    
    // Enter invalid email + valid password
    await page.locator('#login-email').fill('invalid-email');
    await page.locator('#login-password').fill('Test1234!');
    
    // Dispatch native SubmitEvent — React's delegation catches it and runs handleSubmit
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new SubmitEvent('submit', { cancelable: true, bubbles: true }));
      }
    });
    
    // Zod validation prevents navigation
    await expect(page).toHaveURL('/login');
    // Input component sets aria-invalid on validation failure
    await expect(page.locator('#login-email')).toHaveAttribute('aria-invalid', 'true');
  });

  test('should show validation error for empty password', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('#login-email');
    
    // Enter valid email but leave password empty (loginSchema requires password: min(1))
    await page.locator('#login-email').fill('test@example.com');
    
    // Dispatch native SubmitEvent — React's delegation catches it and runs handleSubmit
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new SubmitEvent('submit', { cancelable: true, bubbles: true }));
      }
    });
    
    // Zod validation prevents navigation — stays on /login
    await expect(page).toHaveURL('/login');
    // Input component sets aria-invalid on validation failure
    await expect(page.locator('#login-password')).toHaveAttribute('aria-invalid', 'true');
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
    
    // Should show validation error on the name field
    await expect(page.locator('text=Name must be at least 2 characters')).toBeVisible();
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
