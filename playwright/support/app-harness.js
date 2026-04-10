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
  };
}
