import test from 'node:test';
import assert from 'node:assert/strict';
import { signInAs } from './support/test-server.js';
import { createBoxItemsTestApp } from './support/box-items.js';

async function duplicateBox(app, sessionCookie) {
  const response = await fetch(`${app.baseUrl}/boxes/BOX-0042/duplicate`, {
    method: 'POST',
    redirect: 'manual',
    headers: { cookie: sessionCookie },
  });
  const location = response.headers.get('location');

  return {
    response,
    location,
    boxCode: location?.slice('/boxes/'.length) ?? '',
  };
}

test('GET /boxes/:boxCode for an active box shows a duplicate action', async () => {
  const app = await createBoxItemsTestApp();

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /<form[^>]*action="\/boxes\/BOX-0042\/duplicate"/i);
    assert.match(html, />Duplicate box<\/button>/i);
  } finally {
    await app.close();
  }
});

test('POST /boxes/:boxCode/duplicate creates a new box, redirects to it, and shows copied contents under a new code', async () => {
  const app = await createBoxItemsTestApp();

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const duplicateResponse = await duplicateBox(app, sessionCookie);

    assert.equal(duplicateResponse.response.status, 302);
    const { location, boxCode: newBoxCode } = duplicateResponse;
    assert.match(location, /^\/boxes\/[A-Z0-9-]+$/);
    assert.notEqual(location, '/boxes/BOX-0042');

    const detailResponse = await fetch(`${app.baseUrl}${location}`, {
      headers: { cookie: sessionCookie },
    });
    const html = await detailResponse.text();

    assert.equal(detailResponse.status, 200);
    assert.match(html, new RegExp(`<strong>Box code<\\/strong>: ${newBoxCode}`, 'i'));
    assert.doesNotMatch(html, /<strong>Box code<\/strong>: BOX-0042/i);
    assert.match(html, /Camping Kit/);
    assert.match(html, /Garage shelf/);
    assert.match(html, /Tent pegs/);
  } finally {
    await app.close();
  }
});

test('duplicating a populated box copies item fields and gives the duplicate its own label route', async () => {
  const app = await createBoxItemsTestApp();

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const duplicateResponse = await duplicateBox(app, sessionCookie);
    const { location, boxCode: newBoxCode } = duplicateResponse;

    const [detailResponse, labelResponse] = await Promise.all([
      fetch(`${app.baseUrl}${location}`, {
        headers: { cookie: sessionCookie },
      }),
      fetch(`${app.baseUrl}/boxes/${newBoxCode}/label`, {
        headers: { cookie: sessionCookie },
      }),
    ]);
    const [detailHtml, labelHtml] = await Promise.all([detailResponse.text(), labelResponse.text()]);

    assert.equal(detailResponse.status, 200);
    assert.match(detailHtml, /Tent pegs/);
    assert.match(detailHtml, /Quantity: 12/);
    assert.match(detailHtml, /Category: Camping/);
    assert.match(detailHtml, /Notes: Stored in a mesh bag\./);

    assert.equal(labelResponse.status, 200);
    assert.match(labelHtml, new RegExp(`/q/${newBoxCode}`));
    assert.match(labelHtml, new RegExp(`<strong>Box code<\\/strong>: ${newBoxCode}`, 'i'));
    assert.doesNotMatch(labelHtml, /\/q\/BOX-0042/);
  } finally {
    await app.close();
  }
});

test('duplicating an empty box creates a valid empty duplicate with a fresh code', async () => {
  const app = await createBoxItemsTestApp({ items: [] });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const duplicateResponse = await duplicateBox(app, sessionCookie);

    assert.equal(duplicateResponse.response.status, 302);
    const { location, boxCode: newBoxCode } = duplicateResponse;
    assert.notEqual(location, '/boxes/BOX-0042');

    const detailResponse = await fetch(`${app.baseUrl}${location}`, {
      headers: { cookie: sessionCookie },
    });
    const html = await detailResponse.text();

    assert.equal(detailResponse.status, 200);
    assert.match(html, new RegExp(`<strong>Box code<\\/strong>: ${newBoxCode}`, 'i'));
    assert.match(html, /Add the first item to this box\./i);
    assert.doesNotMatch(html, /Tent pegs/);
  } finally {
    await app.close();
  }
});

test('duplicating a box leaves the source box unchanged and stores copied items only on the new box', async () => {
  const app = await createBoxItemsTestApp();

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const duplicateResponse = await duplicateBox(app, sessionCookie);
    const { location, boxCode: duplicatedBoxCode } = duplicateResponse;

    const [sourceResponse, duplicatedResponse] = await Promise.all([
      fetch(`${app.baseUrl}/boxes/BOX-0042`, {
        headers: { cookie: sessionCookie },
      }),
      fetch(`${app.baseUrl}${location}`, {
        headers: { cookie: sessionCookie },
      }),
    ]);
    const [sourceHtml, duplicatedHtml] = await Promise.all([sourceResponse.text(), duplicatedResponse.text()]);
    const data = await app.readData();
    const sourceBox = data.boxes.find((box) => box.boxCode === 'BOX-0042');
    const duplicatedBox = data.boxes.find((box) => box.boxCode === duplicatedBoxCode);
    const sourceItems = data.items.filter((item) => item.boxId === sourceBox.id);
    const duplicatedItems = data.items.filter((item) => item.boxId === duplicatedBox.id);

    assert.equal(sourceResponse.status, 200);
    assert.equal(duplicatedResponse.status, 200);
    assert.match(sourceHtml, /<strong>Box code<\/strong>: BOX-0042/i);
    assert.match(sourceHtml, /Tent pegs/);
    assert.match(duplicatedHtml, new RegExp(`<strong>Box code<\\/strong>: ${duplicatedBoxCode}`, 'i'));
    assert.match(duplicatedHtml, /Tent pegs/);

    assert.equal(sourceItems.length, 1);
    assert.equal(duplicatedItems.length, 1);
    assert.notEqual(sourceItems[0].id, duplicatedItems[0].id);
    assert.equal(sourceItems[0].boxId, sourceBox.id);
    assert.equal(duplicatedItems[0].boxId, duplicatedBox.id);
  } finally {
    await app.close();
  }
});
