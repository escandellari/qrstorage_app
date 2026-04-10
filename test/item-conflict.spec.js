import test from 'node:test';
import assert from 'node:assert/strict';
import { signInAs } from './support/test-server.js';
import { createBoxItemsTestApp, workspaceMembers } from './support/box-items.js';

function getHiddenInputValue(html, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<input[^>]*type="hidden"[^>]*name="${escapedName}"[^>]*value="([^"]*)"[^>]*\/?>`, 'i'));
  assert.ok(match, `Expected hidden input ${name}`);
  return match[1];
}

test('PATCH /boxes/:boxCode/items/:itemId with a stale changed field shows a conflict state with the latest saved values', async () => {
  const app = await createBoxItemsTestApp({ members: workspaceMembers });

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

    const staleSave = await fetch(`${app.baseUrl}/boxes/BOX-0042/items/item-1`, {
      method: 'PATCH',
      headers: {
        cookie: secondUserCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'Ultralight tent pegs',
        quantity: '12',
        category: 'Camping',
        notes: 'Stored in a mesh bag.',
        originalName: 'Tent pegs',
        originalQuantity: '12',
        originalCategory: 'Camping',
        originalNotes: 'Stored in a mesh bag.',
      }),
    });
    const html = await staleSave.text();

    assert.equal(staleSave.status, 200);
    assert.match(html, /data-react-screen="box-page"/i);
    assert.match(html, /This item was updated by someone else\./i);
    assert.match(html, /Latest saved item/i);
    assert.match(html, /Heavy-duty tent pegs/);
    assert.match(html, /value="Ultralight tent pegs"/);
    assert.doesNotMatch(html, /<strong>Ultralight tent pegs<\/strong>/);
  } finally {
    await app.close();
  }
});

test('PATCH /boxes/:boxCode/items/:itemId after another user changed the item and a validation error occurs keeps the original conflict baseline on retry', async () => {
  const app = await createBoxItemsTestApp({ members: workspaceMembers });

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

    const invalidSave = await fetch(`${app.baseUrl}/boxes/BOX-0042/items/item-1`, {
      method: 'PATCH',
      headers: {
        cookie: secondUserCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: '',
        quantity: '12',
        category: 'Camping',
        notes: 'Stored in a mesh bag.',
        originalName: 'Tent pegs',
        originalQuantity: '12',
        originalCategory: 'Camping',
        originalNotes: 'Stored in a mesh bag.',
      }),
    });
    const invalidHtml = await invalidSave.text();

    assert.equal(invalidSave.status, 200);
    assert.match(invalidHtml, /data-react-screen="box-page"/i);
    assert.match(invalidHtml, /Enter an item name\./i);
    assert.equal(getHiddenInputValue(invalidHtml, 'originalName'), 'Tent pegs');
    assert.equal(getHiddenInputValue(invalidHtml, 'originalQuantity'), '12');
    assert.equal(getHiddenInputValue(invalidHtml, 'originalCategory'), 'Camping');
    assert.equal(getHiddenInputValue(invalidHtml, 'originalNotes'), 'Stored in a mesh bag.');

    const retrySave = await fetch(`${app.baseUrl}/boxes/BOX-0042/items/item-1`, {
      method: 'PATCH',
      headers: {
        cookie: secondUserCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'Ultralight tent pegs',
        quantity: '12',
        category: 'Camping',
        notes: 'Stored in a mesh bag.',
        originalName: getHiddenInputValue(invalidHtml, 'originalName'),
        originalQuantity: getHiddenInputValue(invalidHtml, 'originalQuantity'),
        originalCategory: getHiddenInputValue(invalidHtml, 'originalCategory'),
        originalNotes: getHiddenInputValue(invalidHtml, 'originalNotes'),
      }),
    });
    const retryHtml = await retrySave.text();

    assert.equal(retrySave.status, 200);
    assert.match(retryHtml, /data-react-screen="box-page"/i);
    assert.match(retryHtml, /This item was updated by someone else\./i);
    assert.match(retryHtml, /Heavy-duty tent pegs/);
    assert.doesNotMatch(retryHtml, /<strong>Ultralight tent pegs<\/strong>/);
  } finally {
    await app.close();
  }
});

test('PATCH /boxes/:boxCode/items/:itemId after another user deleted the item shows the removed-item message', async () => {
  const app = await createBoxItemsTestApp({ members: workspaceMembers });

  try {
    const firstUserCookie = await signInAs(app, 'owner@example.com');
    const secondUserCookie = await signInAs(app, 'editor@example.com');

    const deleteResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042/items/item-1/delete`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        cookie: firstUserCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ confirm: 'yes' }),
    });

    assert.equal(deleteResponse.status, 302);

    const staleSave = await fetch(`${app.baseUrl}/boxes/BOX-0042/items/item-1`, {
      method: 'PATCH',
      headers: {
        cookie: secondUserCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'Ultralight tent pegs',
        quantity: '12',
        category: 'Camping',
        notes: 'Stored in a mesh bag.',
        originalName: 'Tent pegs',
        originalQuantity: '12',
        originalCategory: 'Camping',
        originalNotes: 'Stored in a mesh bag.',
      }),
    });
    const html = await staleSave.text();

    assert.equal(staleSave.status, 200);
    assert.match(html, /data-react-screen="box-page"/i);
    assert.match(html, /This item was removed before you could save your changes\./i);
    assert.match(html, /Add the first item to this box\./i);
    assert.doesNotMatch(html, /Ultralight tent pegs/);
  } finally {
    await app.close();
  }
});
