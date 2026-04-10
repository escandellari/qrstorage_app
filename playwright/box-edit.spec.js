import { test, expect } from '@playwright/test';
import { createInventoryShellApp } from './support/app-harness.js';

test('member can edit a box from the React page and see updated details after saving', async ({ page }) => {
  const app = await createInventoryShellApp({
    seedData: {
      workspaces: [{ id: 'workspace-1', name: 'Home Base' }],
      members: [{ id: 'member-1', email: 'owner@example.com', workspaceId: 'workspace-1', role: 'owner' }],
      boxes: [
        {
          id: 'box-1',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0042',
          name: 'Camping Kit',
          locationSummary: 'Garage shelf',
          simpleLocation: 'Garage shelf',
          notes: '',
          status: 'active',
          locationMode: 'simple',
          structuredLocation: null,
        },
      ],
      items: [],
    },
  });

  try {
    await app.signInToInventory(page);
    await page.goto(`${app.baseUrl}/boxes/BOX-0042`);

    const boxForm = page.locator('form[action="/boxes/BOX-0042"]');

    await boxForm.getByLabel('Box name').fill('Winter Camping Kit');
    await boxForm.getByLabel('Location').fill('Hall cupboard');
    await boxForm.getByLabel('Notes').fill('Spare gloves moved to the lid pocket.');
    await boxForm.getByRole('button', { name: 'Save box details' }).click();

    await expect(page.locator('[data-react-screen="box-page"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Winter Camping Kit', exact: true })).toBeVisible();
    await expect(page.getByText('Hall cupboard')).toBeVisible();
    await expect(page.getByText(/Notes:\s*Spare gloves moved to the lid pocket\./)).toBeVisible();
  } finally {
    await app.close();
  }
});
