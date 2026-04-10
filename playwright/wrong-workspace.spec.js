import { test, expect } from '@playwright/test';
import { createWrongWorkspaceSeedData, WRONG_WORKSPACE_BOX_CODE } from '../test/support/wrong-workspace.js';
import { createInventoryShellApp } from './support/app-harness.js';

test('wrong-workspace box deep link renders the React recovery screen without target box details', async ({ page }) => {
  const app = await createInventoryShellApp({
    seedData: createWrongWorkspaceSeedData(),
  });

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await app.signInToInventory(page);
    await page.goto(`${app.baseUrl}/boxes/${WRONG_WORKSPACE_BOX_CODE}`);

    await expect(page.locator('[data-react-screen="box-access-recovery"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Access denied', exact: true })).toBeVisible();
    await expect(page.getByText('Home Base')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Switch workspace' })).toBeVisible();
    await expect(page.getByText('Camping Kit')).toHaveCount(0);
    await expect(page.getByText('Garage shelf')).toHaveCount(0);
    await expect(page.getByText('Check stove fuel before summer.')).toHaveCount(0);
    await expect(page.getByText('Fuel canister')).toHaveCount(0);
    await expect(page.getByText(WRONG_WORKSPACE_BOX_CODE)).toHaveCount(0);
  } finally {
    await app.close();
  }
});
