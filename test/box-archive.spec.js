import test from 'node:test';
import assert from 'node:assert/strict';
import { signInAs } from './support/test-server.js';
import { createBoxItemsTestApp, workspaceMembers } from './support/box-items.js';

test('POST /boxes/:boxCode/archive archives an active box and re-renders the archived state with the same box code', async () => {
  const app = await createBoxItemsTestApp({ members: workspaceMembers });

  try {
    const sessionCookie = await signInAs(app, 'editor@example.com');
    const archiveResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042/archive`, {
      method: 'POST',
      redirect: 'manual',
      headers: { cookie: sessionCookie },
    });

    assert.equal(archiveResponse.status, 302);
    assert.equal(archiveResponse.headers.get('location'), '/boxes/BOX-0042');

    const detailResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await detailResponse.text();

    assert.equal(detailResponse.status, 200);
    assert.match(html, /data-react-screen="box-page"/i);
    assert.match(html, /BOX-0042/);
    assert.match(html, /Camping Kit/);
    assert.match(html, /archived/i);
    assert.match(html, /href="\/inventory"/i);
  } finally {
    await app.close();
  }
});

test('GET /boxes/:boxCode for an active box shows an archive action', async () => {
  const app = await createBoxItemsTestApp({ members: workspaceMembers });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /action="\/boxes\/BOX-0042\/archive"/i);
    assert.match(html, />Archive box<\/button>/i);
  } finally {
    await app.close();
  }
});

test('GET /boxes/:boxCode for an archived box renders the React archived state with the permanent code', async () => {
  const app = await createBoxItemsTestApp({
    members: workspaceMembers,
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
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    await fetch(`${app.baseUrl}/boxes/BOX-0042/archive`, {
      method: 'POST',
      redirect: 'manual',
      headers: { cookie: sessionCookie },
    });

    const response = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /data-react-screen="box-page"/i);
    assert.match(html, /Camping Kit/);
    assert.match(html, /BOX-0042/);
    assert.match(html, /archived/i);
    assert.match(html, /href="\/boxes\/BOX-0042\/label"/i);
    assert.match(html, /Contents/i);
    assert.doesNotMatch(html, /Edit box details/i);
    assert.doesNotMatch(html, /Add item/i);
    assert.doesNotMatch(html, /Save changes/i);
    assert.doesNotMatch(html, /Delete item/i);
  } finally {
    await app.close();
  }
});

test('archiving and restoring a box keeps its detail and label routes bound to the same box code', async () => {
  const app = await createBoxItemsTestApp({ members: workspaceMembers });

  try {
    const sessionCookie = await signInAs(app, 'editor@example.com');

    await fetch(`${app.baseUrl}/boxes/BOX-0042/archive`, {
      method: 'POST',
      redirect: 'manual',
      headers: { cookie: sessionCookie },
    });

    const archivedLabelResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042/label`, {
      headers: { cookie: sessionCookie },
    });
    const archivedLabelHtml = await archivedLabelResponse.text();

    assert.equal(archivedLabelResponse.status, 200);
    assert.match(archivedLabelHtml, /<strong>Box code<\/strong>: BOX-0042/i);
    assert.match(archivedLabelHtml, /BOX-0042/);

    const restoreResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042/restore`, {
      method: 'POST',
      redirect: 'manual',
      headers: { cookie: sessionCookie },
    });

    assert.equal(restoreResponse.status, 302);
    assert.equal(restoreResponse.headers.get('location'), '/boxes/BOX-0042');

    const restoredLabelResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042/label`, {
      headers: { cookie: sessionCookie },
    });
    const restoredLabelHtml = await restoredLabelResponse.text();

    assert.equal(restoredLabelResponse.status, 200);
    assert.match(restoredLabelHtml, /<strong>Box code<\/strong>: BOX-0042/i);
    assert.match(restoredLabelHtml, /Camping Kit/i);
  } finally {
    await app.close();
  }
});
