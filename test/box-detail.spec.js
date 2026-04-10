import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';

test('GET /boxes/:boxCode renders a saved box by its permanent code', async () => {
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
          notes: 'Check stove fuel before summer.',
          status: 'active',
        },
      ],
    },
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Camping Kit/);
    assert.match(html, /Box code/i);
    assert.match(html, /BOX-0042/);
    assert.match(html, /Garage shelf/);
    assert.match(html, /Check stove fuel before summer\./);
  } finally {
    await app.close();
  }
});

test('GET /boxes/:boxCode while signed out redirects to sign-in, preserves return-to, and lands back on the box page after sign-in', async () => {
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
          notes: 'Check stove fuel before summer.',
          status: 'active',
        },
      ],
    },
  });

  try {
    const redirectResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, { redirect: 'manual' });

    assert.equal(redirectResponse.status, 302);
    assert.equal(redirectResponse.headers.get('location'), '/sign-in?returnTo=%2Fboxes%2FBOX-0042');

    const signInResponse = await fetch(`${app.baseUrl}/sign-in`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        email: 'owner@example.com',
        returnTo: '/boxes/BOX-0042',
      }),
    });
    const signInHtml = await signInResponse.text();

    assert.equal(signInResponse.status, 200);
    assert.match(signInHtml, /check your email/i);

    const magicLinkUrl = app.server.getSentEmails().at(-1).magicLinkUrl;
    const magicLinkResponse = await fetch(`${app.baseUrl}${magicLinkUrl}`, { redirect: 'manual' });

    assert.equal(magicLinkResponse.status, 302);
    assert.equal(magicLinkResponse.headers.get('location'), '/boxes/BOX-0042');

    const sessionCookie = magicLinkResponse.headers.get('set-cookie').split(';')[0];
    const boxResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await boxResponse.text();

    assert.equal(boxResponse.status, 200);
    assert.match(html, /Camping Kit/);
  } finally {
    await app.close();
  }
});

test('GET /boxes/:boxCode escapes the page title for user-provided box names', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      boxes: [
        {
          id: 'box-1',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0099',
          name: '</title><script>alert(1)</script><title>',
          locationSummary: '',
          notes: '',
          status: 'active',
        },
      ],
    },
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/boxes/BOX-0099`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /&lt;\/title&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt;&lt;title&gt;/);
    assert.doesNotMatch(html, /<title><\/title><script>alert\(1\)<\/script><title><\/title>/);
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  } finally {
    await app.close();
  }
});
