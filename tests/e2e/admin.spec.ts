import { test, expect } from '@playwright/test';

test.describe('Admin E2E Suite', () => {
  test('should login successfully as Admin', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Login/i }).first().click();

    // Select role
    
    

    // Fill credentials
    await page.locator('#login-email').fill('admin.test@yourdomain.com');
    await page.locator('#login-pass').fill('098765');
    
    // Submit
    await page.locator('form').getByRole('button', { name: /Login/i }).click();

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/admin-debug.png' });

    // Verify successful login (dashboard loads and Logout button is present)
    await expect(page.getByRole('button', { name: /Logout/i })).toBeVisible({ timeout: 15000 });
  });
});

