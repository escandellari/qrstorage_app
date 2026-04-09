import test from 'node:test';
import assert from 'node:assert/strict';
import { signInAs } from './support/test-server.js';
import { createBoxItemsTestApp, defaultItem, workspaceMembers } from './support/box-items.js';

test('POST /boxes/:boxCode/restore returns to the active box page with contents and metadata intact', async () => {
  const app = await createBoxItemsTestApp({ members: workspaceMembers, items: [defaultItem] });

  try {
    const sessionCookie = await signInAs(app, 'editor@example.com');

    await fetch(`${app.baseUrl}/boxes/BOX-0042/archive`, {
      method: 'POST',
      redirect: 'manual',
      headers: { cookie: sessionCookie },
    });

    const restoreResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042/restore`, {
      method: 'POST',
      redirect: 'manual',
      headers: { cookie: sessionCookie },
    });

    assert.equal(restoreResponse.status, 302);
    assert.equal(restoreResponse.headers.get('location'), '/boxes/BOX-0042');

    const detailResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await detailResponse.text();

    assert.equal(detailResponse.status, 200);
    assert.match(html, /<h1>Camping Kit<\/h1>/i);
    assert.match(html, /Garage shelf/i);
    assert.match(html, /Tent pegs/i);
    assert.match(html, /Stored in a mesh bag\./i);
    assert.match(html, /Print label/i);
    assert.match(html, /Edit box details/i);
    assert.doesNotMatch(html, /Box archived/i);
  } finally {
    await app.close();
  }
});
