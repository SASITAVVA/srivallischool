import { test, expect } from '@playwright/test';

test.describe('Srivalli Production Smoke Test', () => {

  test('should load the home page without errors and display main content', async ({ page }) => {
    
    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('response', response => { if(response.status() === 404) console.log("404 URL:", response.url()) }); page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Open /
    // 6. Check that the page does not return a 4xx/5xx response
    const response = await page.goto('/');
    expect(response).not.toBeNull();
    expect(response?.ok()).toBeTruthy(); // Ensures status is 200-399

    // 2. Verifies the page loads successfully.
    // Wait for the network to be idle to ensure SPA is fully loaded
    await page.waitForLoadState('networkidle');

    // 3. Verifies there are no unexpected console errors.
    console.log("CONSOLE ERRORS:", consoleErrors); expect(consoleErrors.length).toBe(0);

    // 4. Verifies the main page content is visible.
    // The hero section or main branding should be visible
    await expect(page.getByRole('heading', { level: 1, name: /Speak Clearly/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Public Speaking/i).first()).toBeVisible({ timeout: 10000 });

    // 5. Verifies important navigation links/buttons are present.
    await expect(page.getByRole('button', { name: /Login/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Book a Free Demo/i }).first()).toBeVisible();
  });

});
