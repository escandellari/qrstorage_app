import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startServer } from '../../src/app.js';

export const defaultSeedData = {
  workspaces: [{ id: 'workspace-1', name: 'Home Base' }],
  members: [{ id: 'member-1', email: 'owner@example.com', workspaceId: 'workspace-1', role: 'owner' }],
};

export async function createTestServer(options = {}) {
  const dataDir = await mkdtemp(join(tmpdir(), 'qrstorage-test-'));
  const server = await startServer({ dataDir, ...options });
  const baseUrl = `http://127.0.0.1:${server.port}`;

  return {
    baseUrl,
    server,
    async close() {
      await server.close();
      await rm(dataDir, { recursive: true, force: true });
    },
  };
}

export async function requestMagicLink(app, email) {
  await fetch(`${app.baseUrl}/sign-in`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email }),
  });

  return app.server.getSentEmails().at(-1).magicLinkUrl;
}
