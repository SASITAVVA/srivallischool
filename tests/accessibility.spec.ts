import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Automated Accessibility & Form Scanner', () => {
  test('Home Page should pass a11y scans', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    if (results.violations.length > 0) {
      console.log('Violations on Home Page:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });

  test('Login Modal should pass a11y scans', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Login/i }).first().click();
    await page.waitForTimeout(1000);
    const results = await new AxeBuilder({ page }).analyze();
    if (results.violations.length > 0) {
      console.log('Violations on Login Modal:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });

  test('Student Registration Form should pass a11y scans', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Register/i }).first().click();
    await page.waitForTimeout(1000);
    const results = await new AxeBuilder({ page }).analyze();
    if (results.violations.length > 0) {
      console.log('Violations on Registration Form:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });
});
