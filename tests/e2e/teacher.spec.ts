import { test, expect } from '@playwright/test';

test.describe('Teacher E2E Suite', () => {
  test('should login successfully as Teacher', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Login/i }).first().click();

    // Select role
    
    

    // Fill credentials
    await page.locator('#login-email').fill('teacher.test@yourdomain.com');
    await page.locator('#login-pass').fill('098765');
    
    // Submit
    await page.locator('form').getByRole('button', { name: /Login/i }).click();

    // Verify successful login
    await expect(page.getByRole('button', { name: /Logout/i })).toBeVisible({ timeout: 15000 });
  });
});

