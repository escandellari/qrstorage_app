import { test, expect } from '@playwright/test';
import { createInventoryShellApp } from './support/app-harness.js';

test('signed-in member sees the React inventory shell with workspace sections', async ({ page }) => {
  const app = await createInventoryShellApp();

  try {
    await page.goto(`${app.baseUrl}/sign-in`);
    await page.getByLabel('Email').fill('owner@example.com');
    await page.getByRole('button', { name: 'Send magic link' }).click();

    await page.goto(`${app.baseUrl}${app.getLatestMagicLinkUrl()}`);

    await expect(page).toHaveURL(`${app.baseUrl}/inventory`);
    await expect(page.locator('[data-react-shell="inventory"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Inventory', exact: true })).toBeVisible();
    await expect(page.getByText('Home Base')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Search inventory' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create box' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Invite people' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your boxes' })).toBeVisible();
  } finally {
    await app.close();
  }
});

test('built inventory shell assets are served to the browser', async ({ page, request }) => {
  const app = await createInventoryShellApp();

  try {
    await page.goto(`${app.baseUrl}/sign-in`);
    await page.getByLabel('Email').fill('owner@example.com');
    await page.getByRole('button', { name: 'Send magic link' }).click();
    await page.goto(`${app.baseUrl}${app.getLatestMagicLinkUrl()}`);

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
