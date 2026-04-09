import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer } from './support/test-server.js';

test('GET /inventory redirects signed-out users to /sign-in and renders the email form', async () => {
  const app = await createTestServer();

  try {
    const redirectResponse = await fetch(`${app.baseUrl}/inventory`, { redirect: 'manual' });
    assert.equal(redirectResponse.status, 302);
    assert.equal(redirectResponse.headers.get('location'), '/sign-in');

    const signInResponse = await fetch(`${app.baseUrl}/sign-in`);
    const html = await signInResponse.text();

    assert.equal(signInResponse.status, 200);
    assert.match(html, /<form[^>]*action="\/sign-in"/);
    assert.match(html, /type="email"/);
    assert.doesNotMatch(html, /inventory/i);
  } finally {
    await app.close();
  }
});
