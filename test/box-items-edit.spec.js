import test from 'node:test';
import assert from 'node:assert/strict';
import { signInAs } from './support/test-server.js';
import { createBoxItemsTestApp, defaultItem, workspaceMembers } from './support/box-items.js';

test('PATCH /boxes/:boxCode/items/:itemId with valid data updates the item and shows the saved values on the box page', async () => {
  const app = await createBoxItemsTestApp();

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const updateResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042/items/item-1`, {
      method: 'PATCH',
      redirect: 'manual',
      headers: {
        cookie: sessionCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'Ultralight tent pegs',
        quantity: '16',
        category: 'Shelter',
        notes: 'Moved into the side pocket.',
        originalName: 'Tent pegs',
        originalQuantity: '12',
        originalCategory: 'Camping',
        originalNotes: 'Stored in a mesh bag.',
      }),
    });

    assert.equal(updateResponse.status, 302);
    assert.equal(updateResponse.headers.get('location'), '/boxes/BOX-0042');

    const detailResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await detailResponse.text();

    assert.equal(detailResponse.status, 200);
    assert.match(html, /Ultralight tent pegs/);
    assert.match(html, /Quantity: 16/);
    assert.match(html, /Category: Shelter/);
    assert.match(html, /Notes: Moved into the side pocket\./);
    assert.doesNotMatch(html, /<strong>Tent pegs<\/strong>/);
  } finally {
    await app.close();
  }
});

test('PATCH /boxes/:boxCode/items/:itemId with invalid data re-renders inline errors and keeps the saved item unchanged', async () => {
  const app = await createBoxItemsTestApp();

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const updateResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042/items/item-1`, {
      method: 'PATCH',
      headers: {
        cookie: sessionCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: '',
        quantity: '1.5',
        category: 'Camping',
        notes: 'Stored in a mesh bag.',
        originalName: 'Tent pegs',
        originalQuantity: '12',
        originalCategory: 'Camping',
        originalNotes: 'Stored in a mesh bag.',
      }),
    });
    const html = await updateResponse.text();

    assert.equal(updateResponse.status, 200);
    assert.match(html, /<form[^>]*action="\/boxes\/BOX-0042\/items\/item-1"/i);
    assert.match(html, /Enter an item name\./i);
    assert.match(html, /Enter a whole number between 1 and 9,999\./i);
    assert.match(html, /<strong>Tent pegs<\/strong>/);
    assert.match(html, /value="1\.5"/);
  } finally {
    await app.close();
  }
});

test('editing another item on the same box page still saves when a different item changed first', async () => {
  const app = await createBoxItemsTestApp({
    members: workspaceMembers,
    items: [
      defaultItem,
      {
        id: 'item-2',
        boxId: 'box-1',
        name: 'Torch',
        quantity: 1,
        category: 'Lighting',
        notes: '',
      },
    ],
  });

  try {
    const firstUserCookie = await signInAs(app, 'owner@example.com');
    const secondUserCookie = await signInAs(app, 'editor@example.com');

    const firstSave = await fetch(`${app.baseUrl}/boxes/BOX-0042/items/item-1`, {
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

    assert.equal(firstSave.status, 302);

    const secondSave = await fetch(`${app.baseUrl}/boxes/BOX-0042/items/item-2`, {
      method: 'PATCH',
      redirect: 'manual',
      headers: {
        cookie: secondUserCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'Head torch',
        quantity: '1',
        category: 'Lighting',
        notes: '',
        originalName: 'Torch',
        originalQuantity: '1',
        originalCategory: 'Lighting',
        originalNotes: '',
      }),
    });

    assert.equal(secondSave.status, 302);
    assert.equal(secondSave.headers.get('location'), '/boxes/BOX-0042');

    const detailResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: secondUserCookie },
    });
    const html = await detailResponse.text();

    assert.equal(detailResponse.status, 200);
    assert.match(html, /Heavy-duty tent pegs/);
    assert.match(html, /<strong>Head torch<\/strong>/);
    assert.doesNotMatch(html, /This item was updated by someone else\./i);
  } finally {
    await app.close();
  }
});
