import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';

test('POST /boxes/:boxCode/items/:itemId/delete removes the item and returns to the box page without it', async () => {
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
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const deleteResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042/items/item-1/delete`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        cookie: sessionCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ confirm: 'yes' }),
    });

    assert.equal(deleteResponse.status, 302);
    assert.equal(deleteResponse.headers.get('location'), '/boxes/BOX-0042');

    const detailResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await detailResponse.text();

    assert.equal(detailResponse.status, 200);
    assert.doesNotMatch(html, /<strong>Tent pegs<\/strong>/);
    assert.match(html, /Add the first item to this box\./i);
  } finally {
    await app.close();
  }
});
