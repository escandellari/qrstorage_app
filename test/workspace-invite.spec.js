import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';
import { createWorkspaceInvite, openInvite } from './support/workspace-invite.js';

test('POST /workspace/invites as an owner sends one workspace invite email', async () => {
  const app = await createTestServer({ seedData: defaultSeedData });

  try {
    const { response } = await createWorkspaceInvite(app, { email: 'invitee@example.com' });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /data-react-shell="inventory"/);
    assert.match(html, /<link rel="stylesheet" href="\/assets\/react-shell\.css" \/>/);
    assert.match(html, /<script type="module" src="\/assets\/react-shell\.js"><\/script>/);
    assert.match(html, /invite sent/i);

    const emails = app.server.getSentEmails();
    assert.equal(emails.length, 2);
    const inviteEmail = emails.at(-1);

    assert.equal(inviteEmail.to, 'invitee@example.com');
    assert.match(inviteEmail.inviteUrl, /\/invites\/[a-z0-9-]+$/i);
  } finally {
    await app.close();
  }
});

test('POST /workspace/invites as a member shows a friendly owner-only permission message', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      members: [...defaultSeedData.members, { id: 'member-2', email: 'member@example.com', workspaceId: 'workspace-1', role: 'member' }],
    },
  });

  try {
    const sessionCookie = await signInAs(app, 'member@example.com');
    const response = await fetch(`${app.baseUrl}/workspace/invites`, {
      method: 'POST',
      headers: {
        cookie: sessionCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'blocked@example.com',
      }),
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /data-react-shell="inventory"/);
    assert.match(html, /<link rel="stylesheet" href="\/assets\/react-shell\.css" \/>/);
    assert.match(html, /<script type="module" src="\/assets\/react-shell\.js"><\/script>/);
    assert.match(html, /only the workspace owner can send invites/i);
    assert.match(html, /contact the owner for access/i);
    assert.match(html, /name="email"[^>]*value="blocked@example.com"/i);
    assert.equal(app.server.getSentEmails().length, 1);
  } finally {
    await app.close();
  }
});

test('owner invite flow without a box destination lands the invited user on inventory', async () => {
  const app = await createTestServer({ seedData: defaultSeedData });

  try {
    const { response: inviteResponse, inviteUrl } = await createWorkspaceInvite(app, {
      email: 'inventory-invitee@example.com',
    });
    assert.equal(inviteResponse.status, 200);

    const { response: openInviteResponse, magicLinkUrl } = await openInvite(app, inviteUrl);
    assert.equal(openInviteResponse.status, 200);

    const magicLinkResponse = await fetch(`${app.baseUrl}${magicLinkUrl}`, { redirect: 'manual' });

    assert.equal(magicLinkResponse.status, 302);
    assert.equal(magicLinkResponse.headers.get('location'), '/inventory');

    const sessionCookie = magicLinkResponse.headers.get('set-cookie').split(';')[0];
    const inventoryResponse = await fetch(`${app.baseUrl}/inventory`, {
      headers: { cookie: sessionCookie },
    });
    const html = await inventoryResponse.text();

    assert.equal(inventoryResponse.status, 200);
    assert.match(html, /Home Base/);
    assert.match(html, /Inventory/);
  } finally {
    await app.close();
  }
});
