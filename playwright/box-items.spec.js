import { test, expect } from '@playwright/test';
import { createInventoryShellApp } from './support/app-harness.js';

test('member can add an item from the React box page and see it in the list', async ({ page }) => {
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
          notes: '',
          status: 'active',
        },
      ],
      items: [],
    },
  });

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await app.signInToInventory(page);
    await page.goto(`${app.baseUrl}/boxes/BOX-0042`);

    const addItemSection = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Add item' }) });

    await addItemSection.getByLabel('Item name').fill('Tent pegs');
    await addItemSection.getByLabel('Item quantity').fill('12');
    await addItemSection.getByLabel('Item category').fill('Camping');
    await addItemSection.getByLabel('Item notes').fill('Stored in a mesh bag.');
    await addItemSection.getByRole('button', { name: 'Add item' }).click();

    await expect(page.locator('[data-react-screen="box-page"]')).toBeVisible();
    await expect(page.getByText('Tent pegs')).toBeVisible();
    await expect(page.getByText('Quantity: 12')).toBeVisible();
    await expect(page.getByText('Category: Camping')).toBeVisible();
    await expect(page.getByText('Notes: Stored in a mesh bag.')).toBeVisible();
  } finally {
    await app.close();
  }
});

test('member can edit an item from the React box page and see updated values', async ({ page }) => {
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
          notes: '',
          status: 'active',
        },
      ],
      items: [
        {
          id: 'item-1',
          boxId: 'box-1',
          name: 'Tent pegs',
          quantity: 12,
          category: 'Camping',
          notes: 'Stored in a mesh bag.',
        },
      ],
    },
  });

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await app.signInToInventory(page);
    await page.goto(`${app.baseUrl}/boxes/BOX-0042`);

    const itemForm = page.locator('form[action="/boxes/BOX-0042/items/item-1"]');

    await itemForm.getByLabel('Item name').fill('Ultralight tent pegs');
    await itemForm.getByLabel('Item quantity').fill('16');
    await itemForm.getByLabel('Item category').fill('Shelter');
    await itemForm.getByLabel('Item notes').fill('Moved into the side pocket.');
    await itemForm.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.locator('[data-react-screen="box-page"]')).toBeVisible();
    await expect(page.getByText('Ultralight tent pegs')).toBeVisible();
    await expect(page.getByText('Quantity: 16')).toBeVisible();
    await expect(page.getByText('Category: Shelter')).toBeVisible();
    await expect(page.getByText('Notes: Moved into the side pocket.')).toBeVisible();
    await expect(page.getByText('Tent pegs', { exact: true })).toHaveCount(0);
  } finally {
    await app.close();
  }
});

test('member can delete an item from the React box page and see the empty-box prompt', async ({ page }) => {
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
          notes: '',
          status: 'active',
        },
      ],
      items: [
        {
          id: 'item-1',
          boxId: 'box-1',
          name: 'Tent pegs',
          quantity: 12,
          category: 'Camping',
          notes: 'Stored in a mesh bag.',
        },
      ],
    },
  });

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await app.signInToInventory(page);
    await page.goto(`${app.baseUrl}/boxes/BOX-0042`);

    await page.getByRole('button', { name: 'Delete item' }).click();

    await expect(page.locator('[data-react-screen="box-page"]')).toBeVisible();
    await expect(page.getByText('Tent pegs', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Add the first item to this box.')).toBeVisible();
  } finally {
    await app.close();
  }
});
