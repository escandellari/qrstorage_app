import test from 'node:test';
import assert from 'node:assert/strict';
import { signInAs } from './support/test-server.js';
import { createBoxItemsTestApp, workspaceMembers } from './support/box-items.js';

test('PATCH /boxes/:boxCode with a stale changed box field shows a conflict screen with the latest saved content', async () => {
  const app = await createBoxItemsTestApp({ members: workspaceMembers });

  try {
    const firstUserCookie = await signInAs(app, 'owner@example.com');
    const secondUserCookie = await signInAs(app, 'editor@example.com');

    const firstSave = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      method: 'PATCH',
      redirect: 'manual',
      headers: {
        cookie: firstUserCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'Winter Camping Kit',
        location: 'Garage shelf',
        notes: '',
        originalBoxName: 'Camping Kit',
        originalBoxLocation: 'Garage shelf',
        originalBoxNotes: '',
      }),
    });

    assert.equal(firstSave.status, 302);

    const staleSave = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      method: 'PATCH',
      headers: {
        cookie: secondUserCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'Archive Camping Kit',
        location: 'Garage shelf',
        notes: '',
        originalBoxName: 'Camping Kit',
        originalBoxLocation: 'Garage shelf',
        originalBoxNotes: '',
      }),
    });
    const html = await staleSave.text();

    assert.equal(staleSave.status, 200);
    assert.match(html, /This box was updated by someone else\./i);
    assert.match(html, /Latest saved box/i);
    assert.match(html, /Winter Camping Kit/);
    assert.match(html, /value="Archive Camping Kit"/i);
    assert.doesNotMatch(html, /<h1>Archive Camping Kit<\/h1>/i);
  } finally {
    await app.close();
  }
});

test('PATCH /boxes/:boxCode still saves when another user changed an item first', async () => {
  const app = await createBoxItemsTestApp({ members: workspaceMembers });

  try {
    const firstUserCookie = await signInAs(app, 'owner@example.com');
    const secondUserCookie = await signInAs(app, 'editor@example.com');

    const itemSave = await fetch(`${app.baseUrl}/boxes/BOX-0042/items/item-1`, {
      method: 'PATCH',
      redirect: 'manual',
      headers: {
        cookie: firstUserCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'Heavy-duty tent pegs',
        quantity: '12',
        category: 'Camping',
        notes: 'Stored in a mesh bag.',
        originalName: 'Tent pegs',
        originalQuantity: '12',
        originalCategory: 'Camping',
        originalNotes: 'Stored in a mesh bag.',
      }),
    });

    assert.equal(itemSave.status, 302);

    const boxSave = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      method: 'PATCH',
      redirect: 'manual',
      headers: {
        cookie: secondUserCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'Camping Kit',
        location: 'Hall cupboard',
        notes: '',
        originalBoxName: 'Camping Kit',
        originalBoxLocation: 'Garage shelf',
        originalBoxNotes: '',
      }),
    });

    assert.equal(boxSave.status, 302);
    assert.equal(boxSave.headers.get('location'), '/boxes/BOX-0042');

    const detailResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: secondUserCookie },
    });
    const html = await detailResponse.text();

    assert.equal(detailResponse.status, 200);
    assert.match(html, /<strong>Location<\/strong>: Hall cupboard/i);
    assert.match(html, /Heavy-duty tent pegs/i);
    assert.doesNotMatch(html, /This box was updated by someone else\./i);
  } finally {
    await app.close();
  }
});
