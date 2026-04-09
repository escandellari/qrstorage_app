import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';

test('GET /inventory/search hides archived boxes by default and includes them when requested', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      boxes: [
        {
          id: 'box-1',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0042',
          name: 'Active needles',
          locationSummary: 'Hall cupboard',
          notes: '',
          status: 'active',
        },
        {
          id: 'box-2',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0043',
          name: 'Archived needles',
          locationSummary: 'Loft',
          notes: '',
          status: 'archived',
        },
      ],
      items: [
        {
          id: 'item-1',
          boxId: 'box-1',
          name: 'Needle case',
          quantity: 1,
          category: 'Sewing',
          notes: '',
        },
        {
          id: 'item-2',
          boxId: 'box-2',
          name: 'Needle pack',
          quantity: 1,
          category: 'Sewing',
          notes: '',
        },
      ],
    },
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');

    const defaultResponse = await fetch(`${app.baseUrl}/inventory/search?q=needle`, {
      headers: { cookie: sessionCookie },
    });
    const defaultHtml = await defaultResponse.text();

    assert.equal(defaultResponse.status, 200);
    assert.match(defaultHtml, /Active needles/i);
    assert.match(defaultHtml, /Needle case/i);
    assert.doesNotMatch(defaultHtml, /Archived needles/i);
    assert.doesNotMatch(defaultHtml, /Needle pack/i);

    const archivedResponse = await fetch(`${app.baseUrl}/inventory/search?q=needle&includeArchived=1`, {
      headers: { cookie: sessionCookie },
    });
    const archivedHtml = await archivedResponse.text();

    assert.equal(archivedResponse.status, 200);
    assert.match(archivedHtml, /Active needles/i);
    assert.match(archivedHtml, /Archived needles/i);
    assert.match(archivedHtml, /Needle case/i);
    assert.match(archivedHtml, /Needle pack/i);
    assert.match(archivedHtml, /name="includeArchived" value="1" checked/i);
  } finally {
    await app.close();
  }
});
