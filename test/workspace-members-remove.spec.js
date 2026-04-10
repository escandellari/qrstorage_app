import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';

test('POST /workspace/members/:memberId/remove removes a member and denies later inventory access', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      members: [
        ...defaultSeedData.members,
        { id: 'member-2', email: 'member@example.com', workspaceId: 'workspace-1', role: 'member' },
      ],
    },
  });

  try {
    const ownerSessionCookie = await signInAs(app, 'owner@example.com');
    const removedSessionCookie = await signInAs(app, 'member@example.com');

    const removeResponse = await fetch(`${app.baseUrl}/workspace/members/member-2/remove`, {
      method: 'POST',
      redirect: 'manual',
      headers: { cookie: ownerSessionCookie },
    });

    assert.equal(removeResponse.status, 302);
    assert.equal(removeResponse.headers.get('location'), '/workspace/members');

    const data = await app.readData();
    assert.equal(data.members.some((member) => member.id === 'member-2'), false);

    const inventoryResponse = await fetch(`${app.baseUrl}/inventory`, {
      redirect: 'manual',
      headers: { cookie: removedSessionCookie },
    });

    assert.equal(inventoryResponse.status, 302);
    assert.equal(inventoryResponse.headers.get('location'), '/sign-in');
  } finally {
    await app.close();
  }
});


test('GET /boxes/:boxCode after removal follows the existing unauthorised recovery path', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      members: [
        ...defaultSeedData.members,
        { id: 'member-2', email: 'member@example.com', workspaceId: 'workspace-1', role: 'member' },
      ],
      boxes: [
        {
          id: 'box-1',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0042',
          name: 'Camping Kit',
          locationSummary: 'Garage shelf',
          notes: 'Check stove fuel before summer.',
          status: 'active',
        },
      ],
    },
  });

  try {
    const ownerSessionCookie = await signInAs(app, 'owner@example.com');
    const removedSessionCookie = await signInAs(app, 'member@example.com');

    await fetch(`${app.baseUrl}/workspace/members/member-2/remove`, {
      method: 'POST',
      redirect: 'manual',
      headers: { cookie: ownerSessionCookie },
    });

    const response = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      redirect: 'manual',
      headers: { cookie: removedSessionCookie },
    });

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), '/sign-in?returnTo=%2Fboxes%2FBOX-0042');
  } finally {
    await app.close();
  }
});


test('POST /workspace/members/:memberId/remove blocks removal of the last remaining owner', async () => {
  const app = await createTestServer({ seedData: defaultSeedData });

  try {
    const ownerSessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/workspace/members/member-1/remove`, {
      method: 'POST',
      headers: { cookie: ownerSessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /at least one owner must remain in the workspace/i);

    const data = await app.readData();
    assert.equal(data.members.some((member) => member.id === 'member-1'), true);
  } finally {
    await app.close();
  }
});


test('POST /workspace/members/:memberId/remove leaves other workspace memberships intact', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      workspaces: [...defaultSeedData.workspaces, { id: 'workspace-2', name: 'Studio' }],
      members: [
        ...defaultSeedData.members,
        { id: 'member-2', email: 'shared@example.com', workspaceId: 'workspace-1', role: 'member' },
        { id: 'member-3', email: 'shared@example.com', workspaceId: 'workspace-2', role: 'owner' },
      ],
    },
  });

  try {
    const ownerSessionCookie = await signInAs(app, 'owner@example.com');

    await fetch(`${app.baseUrl}/workspace/members/member-2/remove`, {
      method: 'POST',
      redirect: 'manual',
      headers: { cookie: ownerSessionCookie },
    });

    const sharedSessionCookie = await signInAs(app, 'shared@example.com');
    const inventoryResponse = await fetch(`${app.baseUrl}/inventory`, {
      headers: { cookie: sharedSessionCookie },
    });
    const html = await inventoryResponse.text();

    assert.equal(inventoryResponse.status, 200);
    assert.match(html, /studio/i);
    assert.doesNotMatch(html, /home base/i);
  } finally {
    await app.close();
  }
});
