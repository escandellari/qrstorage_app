import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';

test('GET /inventory/search ranks exact box code and exact box title matches ahead of broader matches', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
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
        {
          id: 'box-2',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0100',
          name: 'Camping Kit Extras',
          locationSummary: 'Loft',
          notes: '',
          status: 'active',
        },
        {
          id: 'box-3',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0999',
          name: 'Repairs',
          locationSummary: 'Study',
          notes: 'Keep the BOX-0042 manual here.',
          status: 'active',
        },
      ],
      items: [
        {
          id: 'item-1',
          boxId: 'box-3',
          name: 'Camping Kit spare pegs',
          quantity: 4,
          category: 'Camping',
          notes: '',
        },
      ],
    },
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');

    const codeResponse = await fetch(`${app.baseUrl}/inventory/search?q=BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const codeHtml = await codeResponse.text();

    assert.equal(codeResponse.status, 200);
    assert.ok(codeHtml.indexOf('Box code: BOX-0042') < codeHtml.indexOf('Box code: BOX-0999'));

    const titleResponse = await fetch(`${app.baseUrl}/inventory/search?q=Camping%20Kit`, {
      headers: { cookie: sessionCookie },
    });
    const titleHtml = await titleResponse.text();

    assert.equal(titleResponse.status, 200);
    assert.ok(titleHtml.indexOf('Box name: Camping Kit') < titleHtml.indexOf('Box name: Camping Kit Extras'));
    assert.ok(titleHtml.indexOf('Box name: Camping Kit') < titleHtml.indexOf('Item name: Camping Kit spare pegs'));
  } finally {
    await app.close();
  }
});
