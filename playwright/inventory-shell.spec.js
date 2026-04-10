import { test, expect } from '@playwright/test';
import { createInventoryShellApp } from './support/app-harness.js';

test('signed-in member sees the React inventory home with workspace sections on a phone-sized viewport', async ({ page }) => {
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
    },
  });

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await app.signInToInventory(page);

    await expect(page).toHaveURL(`${app.baseUrl}/inventory`);
    await expect(page.locator('[data-react-shell="inventory"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Inventory', exact: true })).toBeVisible();
    await expect(page.getByText('Home Base')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Search inventory' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create box' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Invite people' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your boxes' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Camping Kit' })).toBeVisible();
    await expect(page.getByText('Garage shelf')).toBeVisible();
    await expect(page.getByText('No boxes yet.')).toHaveCount(0);
  } finally {
    await app.close();
  }
});

test('create box from the inventory home redirects to the new box page', async ({ page }) => {
  const app = await createInventoryShellApp();

  try {
    await app.signInToInventory(page);

    await page.getByLabel('Box name').fill('Winter Clothes');
    await page.getByLabel('Location').fill('Hall cupboard');
    await page.getByLabel('Notes').fill('Vacuum bags on top.');
    await page.getByRole('button', { name: 'Create box' }).click();

    await expect(page).toHaveURL(/\/boxes\/[A-Z0-9-]+$/);
    await expect(page.getByRole('heading', { name: 'Winter Clothes', exact: true })).toBeVisible();
    await expect(page.getByText('Hall cupboard')).toBeVisible();
    await expect(page.getByText(/Notes:\s*Vacuum bags on top\./)).toBeVisible();
  } finally {
    await app.close();
  }
});

test('owner invite submission shows confirmation on the inventory home', async ({ page }) => {
  const app = await createInventoryShellApp();

  try {
    await app.signInToInventory(page);

    await page.getByLabel('Email').fill('invitee@example.com');
    await page.getByRole('button', { name: 'Send invite' }).click();

    await expect(page).toHaveURL(`${app.baseUrl}/workspace/invites`);
    await expect(page.locator('[data-react-shell="inventory"]')).toBeVisible();
    await expect(page.getByText('Invite sent.')).toBeVisible();
  } finally {
    await app.close();
  }
});

test('built inventory shell assets are served to the browser', async ({ page, request }) => {
  const app = await createInventoryShellApp();

  try {
    await app.signInToInventory(page);

    await expect(page.locator('link[href="/assets/react-shell.css"]')).toHaveCount(1);
    await expect(page.locator('script[src="/assets/react-shell.js"]')).toHaveCount(1);

    const stylesheetResponse = await request.get(`${app.baseUrl}/assets/react-shell.css`);
    const scriptResponse = await request.get(`${app.baseUrl}/assets/react-shell.js`);

    expect(stylesheetResponse.ok()).toBeTruthy();
    expect(await stylesheetResponse.text()).toContain('.bg-slate-950');
    expect(scriptResponse.ok()).toBeTruthy();
    expect(await scriptResponse.text()).toContain('hydrateRoot');
  } finally {
    await app.close();
  }
});
