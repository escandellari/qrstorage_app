import { createTestServer, defaultSeedData } from '../../test/support/test-server.js';

export async function createInventoryShellApp(options = {}) {
  const app = await createTestServer({
    seedData: options.seedData ?? defaultSeedData,
  });

  return {
    ...app,
    getLatestMagicLinkUrl() {
      return app.server.getSentEmails().at(-1)?.magicLinkUrl ?? '';
    },
    async signInToInventory(page, email = 'owner@example.com') {
      await page.goto(`${app.baseUrl}/sign-in`);
      await page.getByLabel('Email').fill(email);
      await page.getByRole('button', { name: 'Send magic link' }).click();
      await page.goto(`${app.baseUrl}${this.getLatestMagicLinkUrl()}`);
    },
  };
}
