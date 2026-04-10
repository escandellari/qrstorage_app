import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';

test('GET /inventory shows a search form that submits to the inventory search route', async () => {
  const app = await createTestServer({ seedData: defaultSeedData });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/inventory`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /<form[^>]*method="get"[^>]*action="\/inventory\/search"/i);
    assert.match(html, /type="search"/i);
    assert.match(html, /Search inventory/i);
  } finally {
    await app.close();
  }
});

test('GET /inventory/search renders mixed box and item matches that link to the parent box page', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      boxes: [
        {
          id: 'box-1',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0042',
          name: 'Needlework Kit',
          locationSummary: 'Hall cupboard',
          notes: 'Spare needles and thread.',
          status: 'active',
        },
        {
          id: 'box-2',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0099',
          name: 'Camping Kit',
          locationSummary: 'Garage shelf',
          notes: '',
          status: 'active',
        },
      ],
      items: [
        {
          id: 'item-1',
          boxId: 'box-2',
          name: 'Hand needles',
          quantity: 6,
          category: 'Repairs',
          notes: 'Packed beside the patch kit.',
        },
      ],
    },
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/inventory/search?q=needle`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Needlework Kit/);
    assert.match(html, /Hand needles/);
    assert.match(html, /Box match/i);
    assert.match(html, /Item match/i);
    assert.match(html, /href="\/boxes\/BOX-0042"/i);
    assert.match(html, /href="\/boxes\/BOX-0099"/i);
  } finally {
    await app.close();
  }
});

test('GET /inventory/search shows compact result context and excludes another workspace', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      workspaces: [...defaultSeedData.workspaces, { id: 'workspace-2', name: 'Office' }],
      members: [...defaultSeedData.members, { id: 'member-2', email: 'office@example.com', workspaceId: 'workspace-2', role: 'owner' }],
      boxes: [
        {
          id: 'box-1',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0042',
          name: 'Needlework Kit',
          locationSummary: 'Hall cupboard',
          notes: 'Spare needles and thread.',
          status: 'active',
        },
        {
          id: 'box-2',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0099',
          name: 'Camping Kit',
          locationSummary: 'Garage shelf',
          notes: '',
          status: 'active',
        },
        {
          id: 'box-3',
          workspaceId: 'workspace-2',
          boxCode: 'BOX-0007',
          name: 'Office Needles',
          locationSummary: 'Supply room',
          notes: '',
          status: 'active',
        },
      ],
      items: [
        {
          id: 'item-1',
          boxId: 'box-2',
          name: 'Hand needles',
          quantity: 6,
          category: 'Repairs',
          notes: 'Packed beside the patch kit.',
        },
      ],
    },
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/inventory/search?q=needle`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Location: Hall cupboard/i);
    assert.match(html, /Item name: Hand needles/i);
    assert.match(html, /Home Base/i);
    assert.doesNotMatch(html, /Office Needles/);
    assert.doesNotMatch(html, /BOX-0007/);
  } finally {
    await app.close();
  }
});

test('GET /inventory/search shows an empty state with the searched term and a way back to inventory when there are no matches', async () => {
  const app = await createTestServer({ seedData: defaultSeedData });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/inventory/search?q=missing`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /No matches/i);
    assert.match(html, /No matches for “missing”\./i);
    assert.match(html, /href="\/inventory"/i);
    assert.match(html, /Back to inventory/i);
  } finally {
    await app.close();
  }
});
