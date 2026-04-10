import test from 'node:test';
import assert from 'node:assert/strict';
import { createWrongWorkspaceSeedData, WRONG_WORKSPACE_BOX_CODE, WRONG_WORKSPACE_ID } from './support/wrong-workspace.js';
import { createTestServer, signInAs } from './support/test-server.js';

async function createWrongWorkspaceApp(options) {
  return createTestServer({ seedData: createWrongWorkspaceSeedData(options) });
}

test('GET /boxes/:boxCode in the wrong workspace renders an access-denied screen with a switch action', async () => {
  const app = await createWrongWorkspaceApp();

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/boxes/${WRONG_WORKSPACE_BOX_CODE}`, {
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
    const response = await fetch(`${app.baseUrl}/boxes/${WRONG_WORKSPACE_BOX_CODE}`, {
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
    assert.doesNotMatch(html, new RegExp(WRONG_WORKSPACE_BOX_CODE));
  } finally {
    await app.close();
  }
});

test('POST /workspace/switch switches workspace and returns the user to the original box page', async () => {
  const app = await createWrongWorkspaceApp();

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const deniedResponse = await fetch(`${app.baseUrl}/boxes/${WRONG_WORKSPACE_BOX_CODE}`, {
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
      body: new URLSearchParams({ workspaceId: WRONG_WORKSPACE_ID }),
    });

    assert.equal(switchResponse.status, 302);
    assert.equal(switchResponse.headers.get('location'), `/boxes/${WRONG_WORKSPACE_BOX_CODE}`);

    const boxResponse = await fetch(`${app.baseUrl}/boxes/${WRONG_WORKSPACE_BOX_CODE}`, {
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
    const response = await fetch(`${app.baseUrl}/boxes/${WRONG_WORKSPACE_BOX_CODE}`, {
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

test('GET /workspace/request-invite redirects unauthenticated users to sign-in', async () => {
  const app = await createWrongWorkspaceApp();

  try {
    const response = await fetch(`${app.baseUrl}/workspace/request-invite`, {
      redirect: 'manual',
    });

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), '/sign-in');
  } finally {
    await app.close();
  }
});
