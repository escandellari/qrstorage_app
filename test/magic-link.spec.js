import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, requestMagicLink } from './support/test-server.js';

test('GET /auth/magic-link with a valid token creates a session and redirects to /inventory', async () => {
  const app = await createTestServer({ seedData: defaultSeedData });

  try {
    const magicLinkUrl = await requestMagicLink(app, 'owner@example.com');
    const magicLinkResponse = await fetch(`${app.baseUrl}${magicLinkUrl}`, { redirect: 'manual' });

    assert.equal(magicLinkResponse.status, 302);
    assert.equal(magicLinkResponse.headers.get('location'), '/inventory');

    const sessionCookie = magicLinkResponse.headers.get('set-cookie');
    assert.match(sessionCookie, /session=/);

    const inventoryResponse = await fetch(`${app.baseUrl}/inventory`, {
      headers: { cookie: sessionCookie.split(';')[0] },
    });
    const html = await inventoryResponse.text();

    assert.equal(inventoryResponse.status, 200);
    assert.match(html, /Home Base/);
    assert.match(html, /Inventory/);
  } finally {
    await app.close();
  }
});

test('GET /auth/magic-link with an expired token shows a recovery screen and does not create a session', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      magicLinks: [
        {
          token: 'expired-token',
          email: 'owner@example.com',
          memberId: 'member-1',
          expiresAt: '2000-01-01T00:00:00.000Z',
          consumedAt: null,
        },
      ],
    },
  });

  try {
    const response = await fetch(`${app.baseUrl}/auth/magic-link?token=expired-token`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.match(html, /link has expired/i);
    assert.match(html, /request a new magic link/i);

    const inventoryResponse = await fetch(`${app.baseUrl}/inventory`, { redirect: 'manual' });
    assert.equal(inventoryResponse.status, 302);
    assert.equal(inventoryResponse.headers.get('location'), '/sign-in');
  } finally {
    await app.close();
  }
});

test('GET /auth/magic-link rejects a token after it has already been used once', async () => {
  const app = await createTestServer({ seedData: defaultSeedData });

  try {
    const magicLinkUrl = await requestMagicLink(app, 'owner@example.com');
    const firstResponse = await fetch(`${app.baseUrl}${magicLinkUrl}`, { redirect: 'manual' });
    const firstCookie = firstResponse.headers.get('set-cookie');
    assert.match(firstCookie, /session=/);

    const secondResponse = await fetch(`${app.baseUrl}${magicLinkUrl}`);
    const secondHtml = await secondResponse.text();

    assert.equal(secondResponse.status, 200);
    assert.equal(secondResponse.headers.get('set-cookie'), null);
    assert.match(secondHtml, /request a new magic link/i);

    const inventoryResponse = await fetch(`${app.baseUrl}/inventory`, {
      headers: { cookie: firstCookie.split(';')[0] },
    });
    assert.equal(inventoryResponse.status, 200);
  } finally {
    await app.close();
  }
});

test('GET /auth/magic-link only creates one session when the same token is opened concurrently', async () => {
  const app = await createTestServer({ seedData: defaultSeedData });

  try {
    const magicLinkUrl = await requestMagicLink(app, 'owner@example.com');
    const responses = await Promise.all([
      fetch(`${app.baseUrl}${magicLinkUrl}`, { redirect: 'manual' }),
      fetch(`${app.baseUrl}${magicLinkUrl}`, { redirect: 'manual' }),
    ]);
    const outcomes = await Promise.all(
      responses.map(async (response) => ({
        status: response.status,
        location: response.headers.get('location'),
        cookie: response.headers.get('set-cookie'),
        body: await response.text(),
      })),
    );

    const successfulSignIns = outcomes.filter((outcome) => outcome.status === 302);
    const rejectedSignIns = outcomes.filter((outcome) => outcome.status === 200);

    assert.equal(successfulSignIns.length, 1);
    assert.equal(successfulSignIns[0].location, '/inventory');
    assert.match(successfulSignIns[0].cookie, /session=/);

    assert.equal(rejectedSignIns.length, 1);
    assert.equal(rejectedSignIns[0].cookie, null);
    assert.match(rejectedSignIns[0].body, /request a new magic link/i);
  } finally {
    await app.close();
  }
});
