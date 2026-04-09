import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';

test('owner invite flow joins the invited user to the workspace and lands on the invited box page', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      boxes: [
        {
          id: 'box-1',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0042',
          name: 'Camping Kit',
          locationSummary: 'Garage shelf',
          notes: '',
          status: 'active',
        },
      ],
    },
  });

  try {
    const ownerCookie = await signInAs(app, 'owner@example.com');
    const inviteResponse = await fetch(`${app.baseUrl}/workspace/invites`, {
      method: 'POST',
      headers: {
        cookie: ownerCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'invitee@example.com',
        returnTo: '/q/BOX-0042',
      }),
    });
    assert.equal(inviteResponse.status, 200);

    const inviteUrl = app.server.getSentEmails().at(-1).inviteUrl;
    const openInviteResponse = await fetch(`${app.baseUrl}${inviteUrl}`);
    const inviteHtml = await openInviteResponse.text();

    assert.equal(openInviteResponse.status, 200);
    assert.match(inviteHtml, /check your email/i);

    const magicLinkUrl = app.server.getSentEmails().at(-1).magicLinkUrl;
    const magicLinkResponse = await fetch(`${app.baseUrl}${magicLinkUrl}`, { redirect: 'manual' });

    assert.equal(magicLinkResponse.status, 302);
    assert.equal(magicLinkResponse.headers.get('location'), '/boxes/BOX-0042');

    const sessionCookie = magicLinkResponse.headers.get('set-cookie').split(';')[0];
    const boxResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const boxHtml = await boxResponse.text();

    assert.equal(boxResponse.status, 200);
    assert.match(boxHtml, /Camping Kit/);

    const signInResponse = await fetch(`${app.baseUrl}/sign-in`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: 'invitee@example.com' }),
    });
    assert.equal(signInResponse.status, 200);
    assert.equal(app.server.getSentEmails().at(-1).to, 'invitee@example.com');
    assert.match(app.server.getSentEmails().at(-1).magicLinkUrl, /\/auth\/magic-link\?token=/);
  } finally {
    await app.close();
  }
});

test('re-opening an accepted invite does not create duplicate membership and lands the user cleanly', async () => {
  const app = await createTestServer({ seedData: defaultSeedData });

  try {
    const ownerCookie = await signInAs(app, 'owner@example.com');
    const inviteResponse = await fetch(`${app.baseUrl}/workspace/invites`, {
      method: 'POST',
      headers: {
        cookie: ownerCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'repeat@example.com',
      }),
    });
    assert.equal(inviteResponse.status, 200);

    const inviteUrl = app.server.getSentEmails().at(-1).inviteUrl;
    await fetch(`${app.baseUrl}${inviteUrl}`);
    let magicLinkUrl = app.server.getSentEmails().at(-1).magicLinkUrl;
    let magicLinkResponse = await fetch(`${app.baseUrl}${magicLinkUrl}`, { redirect: 'manual' });

    assert.equal(magicLinkResponse.status, 302);
    assert.equal(magicLinkResponse.headers.get('location'), '/inventory');

    await fetch(`${app.baseUrl}${inviteUrl}`);
    magicLinkUrl = app.server.getSentEmails().at(-1).magicLinkUrl;
    magicLinkResponse = await fetch(`${app.baseUrl}${magicLinkUrl}`, { redirect: 'manual' });

    assert.equal(magicLinkResponse.status, 302);
    assert.equal(magicLinkResponse.headers.get('location'), '/inventory');

    const data = await app.readData();
    const inviteeMembers = data.members.filter((member) => member.email === 'repeat@example.com' && member.workspaceId === 'workspace-1');

    assert.equal(inviteeMembers.length, 1);
  } finally {
    await app.close();
  }
});

test('GET /invites/:inviteToken for an invalid or expired invite shows the invite recovery screen and does not join the workspace', async () => {
  const cases = [
    {
      name: 'invalid invite',
      path: '/invites/not-a-real-invite',
      seedData: defaultSeedData,
      email: 'missing@example.com',
    },
    {
      name: 'expired invite',
      path: '/invites/expired-invite',
      seedData: {
        ...defaultSeedData,
        invites: [
          {
            token: 'expired-invite',
            workspaceId: 'workspace-1',
            email: 'expired@example.com',
            expiresAt: '2000-01-01T00:00:00.000Z',
            returnTo: '/inventory',
            acceptedAt: null,
          },
        ],
      },
      email: 'expired@example.com',
    },
  ];

  for (const testCase of cases) {
    const app = await createTestServer({ seedData: testCase.seedData });

    try {
      const response = await fetch(`${app.baseUrl}${testCase.path}`);
      const html = await response.text();

      assert.equal(response.status, 200, testCase.name);
      assert.match(html, /invite link has expired/i, testCase.name);
      assert.match(html, /request a new invite/i, testCase.name);
      assert.equal(app.server.getSentEmails().length, 0, testCase.name);

      const signInResponse = await fetch(`${app.baseUrl}/sign-in`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email: testCase.email }),
      });
      assert.equal(signInResponse.status, 200, testCase.name);
      assert.equal(app.server.getSentEmails().length, 0, testCase.name);
    } finally {
      await app.close();
    }
  }
});
