import { test, expect } from '@playwright/test';
import { createInventoryShellApp } from './support/app-harness.js';

test('inventory search renders ranked React results and opens the destination box page', async ({ page }) => {
  const app = await createInventoryShellApp({
    seedData: {
      workspaces: [{ id: 'workspace-1', name: 'Home Base' }],
      members: [{ id: 'member-1', email: 'owner@example.com', workspaceId: 'workspace-1', role: 'owner' }],
      boxes: [
        {
          id: 'box-1',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0042',
          name: 'Spare',
          locationSummary: 'Hall cupboard',
          notes: '',
          status: 'active',
        },
        {
          id: 'box-2',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0099',
          name: 'Camping Kit',
          locationSummary: 'Garage shelf',
          notes: '',
          status: 'active',
        },
      ],
      items: [
        {
          id: 'item-1',
          boxId: 'box-2',
          name: 'Spare stove washer',
          quantity: 1,
          category: 'Repairs',
          notes: '',
        },
      ],
    },
  });

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await app.signInToInventory(page);
    await page.goto(`${app.baseUrl}/inventory/search?q=spare`);

    await expect(page.locator('[data-react-screen="inventory-search"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Search inventory', exact: true })).toBeVisible();
    await expect(page.getByText('Box match')).toBeVisible();
    await expect(page.getByText('Item match')).toBeVisible();
    await expect(page.getByText('Hall cupboard')).toBeVisible();
    await expect(page.getByText('Camping Kit')).toBeVisible();

    const resultRows = page.locator('[data-search-result-row]');
    await expect(resultRows.first()).toContainText('BOX-0042');

    await page.getByRole('link', { name: /Box match[\s\S]*BOX-0042/i }).click();
    await expect(page).toHaveURL(`${app.baseUrl}/boxes/BOX-0042`);
    await expect(page.getByRole('heading', { name: 'Spare', exact: true })).toBeVisible();
  } finally {
    await app.close();
  }
});

test('inventory search shows an empty state with a way back to inventory', async ({ page }) => {
  const app = await createInventoryShellApp();

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await app.signInToInventory(page);
    await page.goto(`${app.baseUrl}/inventory/search?q=missing`);

    await expect(page.locator('[data-react-screen="inventory-search"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No matches' })).toBeVisible();
    await expect(page.getByText('No matches for “missing”.')).toBeVisible();
    await expect(page.locator('[data-search-result-row]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Back to inventory' })).toHaveAttribute('href', '/inventory');
  } finally {
    await app.close();
  }
});
