import { test, expect } from '@playwright/test';
import { createInventoryShellApp } from './support/app-harness.js';

test('signed-in visit to request-invite renders the React guidance page', async ({ page }) => {
  const app = await createInventoryShellApp();

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await app.signInToInventory(page);
    await page.goto(`${app.baseUrl}/workspace/request-invite`);

    await expect(page.locator('[data-react-screen="box-access-recovery"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Request an invite', exact: true })).toBeVisible();
    await expect(page.getByText('Home Base')).toBeVisible();
    await expect(page.getByText('Ask a member of the correct workspace to send you an invite.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to inventory' })).toHaveAttribute('href', '/inventory');
  } finally {
    await app.close();
  }
});
