import { test, expect } from '@playwright/test';
import { createTestServer } from '../test/support/test-server.js';

test('GET /sign-in renders the React sign-in screen and shows the neutral confirmation after submit', async ({ page }) => {
  const app = await createTestServer();

  try {
    await page.goto(`${app.baseUrl}/sign-in?returnTo=/boxes/BOX-1`);

    await expect(page.locator('[data-react-screen="sign-in"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
    await expect(page.locator('input[name="returnTo"]')).toHaveValue('/boxes/BOX-1');

    await page.getByLabel('Email').fill('owner@example.com');
    await page.getByRole('button', { name: 'Send magic link' }).click();

    await expect(page.locator('[data-react-screen="check-email"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Check your email', exact: true })).toBeVisible();
    await expect(page.getByText('If that email can access this workspace, we have sent a magic link.')).toBeVisible();
    await expect(page.getByText('owner@example.com')).toHaveCount(0);
  } finally {
    await app.close();
  }
});
