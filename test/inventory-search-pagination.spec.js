import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';

test('GET /inventory/search returns 50 results first and the next 50 after load more', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      boxes: Array.from({ length: 120 }, (_, index) => ({
        id: `box-${index + 1}`,
        workspaceId: 'workspace-1',
        boxCode: `BOX-${String(index + 1).padStart(4, '0')}`,
        name: `Needle result ${index + 1}`,
        locationSummary: `Shelf ${index + 1}`,
        notes: '',
        status: 'active',
      })),
    },
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');

    const firstResponse = await fetch(`${app.baseUrl}/inventory/search?q=needle`, {
      headers: { cookie: sessionCookie },
    });
    const firstHtml = await firstResponse.text();

    assert.equal(firstResponse.status, 200);
    assert.equal((firstHtml.match(/<li>/g) ?? []).length, 50);
    assert.match(firstHtml, /href="\/inventory\/search\?q=needle&amp;offset=50"/i);
    assert.match(firstHtml, /Box code: BOX-0001/i);
    assert.match(firstHtml, /Box code: BOX-0050/i);
    assert.doesNotMatch(firstHtml, /Box code: BOX-0051/i);

    const secondResponse = await fetch(`${app.baseUrl}/inventory/search?q=needle&offset=50`, {
      headers: { cookie: sessionCookie },
    });
    const secondHtml = await secondResponse.text();

    assert.equal(secondResponse.status, 200);
    assert.equal((secondHtml.match(/<li>/g) ?? []).length, 50);
    assert.match(secondHtml, /Box code: BOX-0051/i);
    assert.match(secondHtml, /Box code: BOX-0100/i);
    assert.doesNotMatch(secondHtml, /Box code: BOX-0001/i);
    assert.match(secondHtml, /href="\/inventory\/search\?q=needle&amp;offset=100"/i);
  } finally {
    await app.close();
  }
});
