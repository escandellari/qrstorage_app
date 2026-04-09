import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';
import { defaultBox, defaultItem } from './support/box-items.js';

function createBoxSearchApp({ boxes = [defaultBox], items = [] } = {}) {
  return createTestServer({
    seedData: {
      ...defaultSeedData,
      boxes,
      items,
    },
  });
}

test('GET /boxes/:boxCode shows a search action that opens inventory search, and search results still open box pages', async () => {
  const app = await createBoxSearchApp({
    boxes: [
      defaultBox,
      {
        ...defaultBox,
        id: 'box-2',
        boxCode: 'BOX-0099',
        name: 'Needlework Kit',
        locationSummary: 'Hall cupboard',
      },
    ],
    items: [
      {
        ...defaultItem,
        boxId: 'box-2',
        name: 'Hand needles',
        quantity: 6,
        category: 'Repairs',
        notes: '',
      },
    ],
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');

    const boxResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const boxHtml = await boxResponse.text();

    assert.equal(boxResponse.status, 200);
    assert.match(boxHtml, /<a[^>]*href="\/inventory\/search"[^>]*>Search inventory<\/a>/i);

    const searchResponse = await fetch(`${app.baseUrl}/inventory/search?q=needle`, {
      headers: { cookie: sessionCookie },
    });
    const searchHtml = await searchResponse.text();

    assert.equal(searchResponse.status, 200);
    assert.match(searchHtml, /href="\/boxes\/BOX-0099"/i);

    const otherBoxResponse = await fetch(`${app.baseUrl}/boxes/BOX-0099`, {
      headers: { cookie: sessionCookie },
    });
    const otherBoxHtml = await otherBoxResponse.text();

    assert.equal(otherBoxResponse.status, 200);
    assert.match(otherBoxHtml, /Needlework Kit/);
  } finally {
    await app.close();
  }
});

test('GET /boxes/:boxCode for an empty box still shows the search action', async () => {
  const app = await createBoxSearchApp();

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /<a[^>]*href="\/inventory\/search"[^>]*>Search inventory<\/a>/i);
    assert.match(html, /Add the first item to this box\./i);
  } finally {
    await app.close();
  }
});

test('GET /boxes/:boxCode keeps the search action in the box page chrome for narrow layouts', async () => {
  const app = await createBoxSearchApp({ items: [{ ...defaultItem, notes: '' }] });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /<nav>[\s\S]*Search inventory[\s\S]*<\/nav>/i);
    assert.ok(html.indexOf('Search inventory') < html.indexOf('<h1>Camping Kit</h1>'));
    assert.ok(html.indexOf('Search inventory') < html.indexOf('Edit box details'));
  } finally {
    await app.close();
  }
});
