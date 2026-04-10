import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData } from './support/test-server.js';

test('POST /sign-in with an invited email shows neutral confirmation and records one magic-link delivery', async () => {
  const app = await createTestServer({ seedData: defaultSeedData });

  try {
    const response = await fetch(`${app.baseUrl}/sign-in`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: 'owner@example.com' }),
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /check your email/i);

    const deliveries = app.server.getSentEmails();
    assert.equal(deliveries.length, 1);
    assert.equal(deliveries[0].to, 'owner@example.com');
    assert.match(deliveries[0].magicLinkUrl, /\/auth\/magic-link\?token=/);
  } finally {
    await app.close();
  }
});

test('POST /sign-in with an unknown email shows the same confirmation and records no delivery', async () => {
  const app = await createTestServer({ seedData: defaultSeedData });

  try {
    const response = await fetch(`${app.baseUrl}/sign-in`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: 'unknown@example.com' }),
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /check your email/i);
    assert.doesNotMatch(html, /unknown@example\.com/i);
    assert.equal(app.server.getSentEmails().length, 0);
  } finally {
    await app.close();
  }
});

test('POST /sign-in preserves a valid returnTo for the later magic-link redirect', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      boxes: [
        {
          id: 'box-1',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-1',
          name: 'Camping Kit',
          locationSummary: 'Garage shelf',
          notes: '',
          status: 'active',
        },
      ],
    },
  });

  try {
    const signInResponse = await fetch(`${app.baseUrl}/sign-in`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        email: 'owner@example.com',
        returnTo: '/boxes/BOX-1',
      }),
    });
    assert.equal(signInResponse.status, 200);

    const magicLinkResponse = await fetch(`${app.baseUrl}${app.server.getSentEmails()[0].magicLinkUrl}`, { redirect: 'manual' });

    assert.equal(magicLinkResponse.status, 302);
    assert.equal(magicLinkResponse.headers.get('location'), '/boxes/BOX-1');
  } finally {
    await app.close();
  }
});
