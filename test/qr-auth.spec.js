import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData } from './support/test-server.js';

test('GET /q/:boxCode while signed out redirects to sign-in, preserves return-to, and does not leak box details', async () => {
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
    const redirectResponse = await fetch(`${app.baseUrl}/q/BOX-0042`, { redirect: 'manual' });

    assert.equal(redirectResponse.status, 302);
    assert.equal(redirectResponse.headers.get('location'), '/sign-in?returnTo=%2Fq%2FBOX-0042');

    const signInResponse = await fetch(`${app.baseUrl}/sign-in?returnTo=%2Fq%2FBOX-0042`);
    const html = await signInResponse.text();

    assert.equal(signInResponse.status, 200);
    assert.match(html, /access is required/i);
    assert.match(html, /<form[^>]*action="\/sign-in"/i);
    assert.match(html, /name="returnTo"/i);
    assert.doesNotMatch(html, /Camping Kit/);
    assert.doesNotMatch(html, /Garage shelf/);
    assert.doesNotMatch(html, /Check stove fuel before summer\./);
    assert.doesNotMatch(html, /Home Base/);
  } finally {
    await app.close();
  }
});

test('GET /q/:boxCode while signed out redirects to sign-in even when the box is invalid or deleted', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      boxes: [
        {
          id: 'box-9',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0999',
          name: 'Private Papers',
          locationSummary: 'Office cabinet',
          notes: 'Bank details inside.',
          status: 'deleted',
        },
      ],
    },
  });

  try {
    for (const path of ['/q/not-a-real-code', '/q/BOX-0999']) {
      const response = await fetch(`${app.baseUrl}${path}`, { redirect: 'manual' });

      assert.equal(response.status, 302);
      assert.equal(response.headers.get('location'), `/sign-in?returnTo=${encodeURIComponent(path)}`);
    }
  } finally {
    await app.close();
  }
});

test('signing in from the QR flow returns the member to the scanned box page', async () => {
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
    const signInResponse = await fetch(`${app.baseUrl}/sign-in`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        email: 'owner@example.com',
        returnTo: '/q/BOX-0042',
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
    const boxHtml = await boxResponse.text();

    assert.equal(boxResponse.status, 200);
    assert.match(boxHtml, /Camping Kit/);
  } finally {
    await app.close();
  }
});
