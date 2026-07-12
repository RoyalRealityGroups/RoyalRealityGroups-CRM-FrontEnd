import { test, expect } from '@playwright/test';

const base = process.env.E2E_BASE_URL || 'http://localhost:5173';
const username = process.env.E2E_USER || 'admin@example.com';
const password = process.env.E2E_PASS || 'password';

test.describe('Smoke: auth and navigation', () => {
  test('login and navigate hubs', async ({ page }) => {
    await page.goto(`${base}/login`);
    await page.getByLabel(/username/i).fill(username);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page).toHaveURL(/dashboard/i);

    // Masters hub
    await page.getByRole('link', { name: /masters/i }).click();
    await expect(page).toHaveURL(/masters/i);

    // Sales orders list
    await page.getByRole('link', { name: /sales/i }).click();
    await page.getByRole('link', { name: /orders/i }).click();
    await expect(page).toHaveURL(/sales\/orders/i);
    await expect(page.getByRole('heading', { name: /orders/i })).toBeVisible();

    // Import module wizard entry
    await page.getByRole('link', { name: /import/i }).click();
    await expect(page).toHaveURL(/import/);
  });
});
