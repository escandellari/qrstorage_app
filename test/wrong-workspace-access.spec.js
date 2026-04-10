import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';

function createWrongWorkspaceSeedData({ includeTargetMembership = true, items = [] } = {}) {
  return {
    ...defaultSeedData,
    workspaces: [...defaultSeedData.workspaces, { id: 'workspace-2', name: 'Studio' }],
    members: includeTargetMembership
      ? [...defaultSeedData.members, { id: 'member-2', email: 'owner@example.com', workspaceId: 'workspace-2', role: 'owner' }]
      : defaultSeedData.members,
    boxes: [
      {
        id: 'box-1',
        workspaceId: 'workspace-2',
        boxCode: 'BOX-0042',
        name: 'Camping Kit',
        locationSummary: 'Garage shelf',
        notes: 'Check stove fuel before summer.',
        status: 'active',
      },
    ],
    items,
  };
}

async function createWrongWorkspaceApp(options) {
  return createTestServer({ seedData: createWrongWorkspaceSeedData(options) });
}

test('GET /boxes/:boxCode in the wrong workspace renders an access-denied screen with a switch action', async () => {
  const app = await createWrongWorkspaceApp();

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 403);
    assert.match(html, /access denied/i);
    assert.match(html, /Home Base/);
    assert.match(html, /<form[^>]*action="\/workspace\/switch"/i);
    assert.doesNotMatch(html, /Camping Kit/);
  } finally {
    await app.close();
  }
});

test('GET /boxes/:boxCode in the wrong workspace shows the current workspace name and hides target box metadata', async () => {
  const app = await createWrongWorkspaceApp({
    items: [
      {
        id: 'item-1',
        boxId: 'box-1',
        name: 'Fuel canister',
        quantity: 1,
        category: 'Camping',
        notes: 'Full tank',
      },
    ],
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 403);
    assert.match(html, /Home Base/);
    assert.doesNotMatch(html, /Studio/);
    assert.doesNotMatch(html, /Camping Kit/);
    assert.doesNotMatch(html, /Garage shelf/);
    assert.doesNotMatch(html, /Check stove fuel before summer\./);
    assert.doesNotMatch(html, /Fuel canister/);
    assert.doesNotMatch(html, /Full tank/);
    assert.doesNotMatch(html, /BOX-0042/);
  } finally {
    await app.close();
  }
});

test('POST /workspace/switch switches workspace and returns the user to the original box page', async () => {
  const app = await createWrongWorkspaceApp();

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const deniedResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });

    assert.equal(deniedResponse.status, 403);

    const switchResponse = await fetch(`${app.baseUrl}/workspace/switch`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        cookie: sessionCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ workspaceId: 'workspace-2' }),
    });

    assert.equal(switchResponse.status, 302);
    assert.equal(switchResponse.headers.get('location'), '/boxes/BOX-0042');

    const boxResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const boxHtml = await boxResponse.text();

    assert.equal(boxResponse.status, 200);
    assert.match(boxHtml, /Camping Kit/);
    assert.match(boxHtml, /Garage shelf/);
    assert.match(boxHtml, /Check stove fuel before summer\./);
  } finally {
    await app.close();
  }
});

test('GET /boxes/:boxCode without target-workspace membership shows a request-invite action instead of a switch action', async () => {
  const app = await createWrongWorkspaceApp({ includeTargetMembership: false });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 403);
    assert.match(html, /request an invite/i);
    assert.match(html, /href="\/workspace\/request-invite"/i);
    assert.doesNotMatch(html, /action="\/workspace\/switch"/i);
  } finally {
    await app.close();
  }
});
