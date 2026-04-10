import { test, expect } from '@playwright/test';
import { createInventoryShellApp } from './support/app-harness.js';

function createWrongWorkspaceSeedData({ includeTargetMembership = true } = {}) {
  return {
    workspaces: [
      { id: 'workspace-1', name: 'Home Base' },
      { id: 'workspace-2', name: 'Studio' },
    ],
    members: [
      { id: 'member-1', email: 'owner@example.com', workspaceId: 'workspace-1', role: 'owner' },
      ...(includeTargetMembership
        ? [{ id: 'member-2', email: 'owner@example.com', workspaceId: 'workspace-2', role: 'owner' }]
        : []),
    ],
    boxes: [
      {
        id: 'box-1',
        workspaceId: 'workspace-2',
        boxCode: 'BOX-0042',
        name: 'Camping Kit',
        locationSummary: 'Garage shelf',
        notes: 'Check stove fuel before summer.',
        status: 'active',
      },
    ],
    items: [
      {
        id: 'item-1',
        boxId: 'box-1',
        name: 'Fuel canister',
        quantity: 1,
        category: 'Camping',
        notes: 'Full tank',
      },
    ],
  };
}

test('wrong-workspace box deep link renders the React recovery screen without target box details', async ({ page }) => {
  const app = await createInventoryShellApp({
    seedData: createWrongWorkspaceSeedData(),
  });

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await app.signInToInventory(page);
    await page.goto(`${app.baseUrl}/boxes/BOX-0042`);

    await expect(page.locator('[data-react-screen="box-access-recovery"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Access denied', exact: true })).toBeVisible();
    await expect(page.getByText('Home Base')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Switch workspace' })).toBeVisible();
    await expect(page.getByText('Camping Kit')).toHaveCount(0);
    await expect(page.getByText('Garage shelf')).toHaveCount(0);
    await expect(page.getByText('Check stove fuel before summer.')).toHaveCount(0);
    await expect(page.getByText('Fuel canister')).toHaveCount(0);
    await expect(page.getByText('BOX-0042')).toHaveCount(0);
  } finally {
    await app.close();
  }
});
