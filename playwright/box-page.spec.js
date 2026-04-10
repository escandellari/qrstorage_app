import { test, expect } from '@playwright/test';
import { createInventoryShellApp } from './support/app-harness.js';

test('valid box route renders the React box overview with permanent code and label link', async ({ page }) => {
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
          notes: 'Check stove fuel before summer.',
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

    await expect(page.locator('[data-react-screen="box-page"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Camping Kit', exact: true })).toBeVisible();
    await expect(page.getByText('BOX-0042')).toBeVisible();
    await expect(page.getByText('Garage shelf')).toBeVisible();
    await expect(page.getByText(/Notes:\s*Check stove fuel before summer\./)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Print label' })).toHaveAttribute('href', '/boxes/BOX-0042/label');
    await expect(page.getByRole('heading', { name: 'Contents' })).toBeVisible();
  } finally {
    await app.close();
  }
});

test('empty box route shows the next-step prompt in the React item area', async ({ page }) => {
  const app = await createInventoryShellApp({
    seedData: {
      workspaces: [{ id: 'workspace-1', name: 'Home Base' }],
      members: [{ id: 'member-1', email: 'owner@example.com', workspaceId: 'workspace-1', role: 'owner' }],
      boxes: [
        {
          id: 'box-1',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0043',
          name: 'Spare Cables',
          locationSummary: '',
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
    await page.goto(`${app.baseUrl}/boxes/BOX-0043`);

    await expect(page.locator('[data-react-screen="box-page"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Contents' })).toBeVisible();
    await expect(page.getByText('Add the first item to this box.')).toBeVisible();
  } finally {
    await app.close();
  }
});
