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
