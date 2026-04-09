import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';

test('GET /q/:boxCode for a signed-in member redirects to the matching box page', async () => {
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
    const response = await fetch(`${app.baseUrl}/q/BOX-0042`, {
      redirect: 'manual',
      headers: { cookie: sessionCookie },
    });

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), '/boxes/BOX-0042');

    const boxResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await boxResponse.text();

    assert.equal(boxResponse.status, 200);
    assert.match(html, /Camping Kit/);
    assert.match(html, /Garage shelf/);
    assert.match(html, /Check stove fuel before summer\./);
  } finally {
    await app.close();
  }
});

test('GET /q/:boxCode shows the same neutral not-found screen for invalid and deleted boxes', async () => {
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
      const html = await response.text();

      assert.equal(response.status, 404);
      assert.match(html, /we couldn't find that box/i);
      assert.match(html, /href="\/inventory"/i);
      assert.doesNotMatch(html, /Private Papers/);
      assert.doesNotMatch(html, /Office cabinet/);
      assert.doesNotMatch(html, /Bank details inside\./);
      assert.doesNotMatch(html, /Home Base/);
    }
  } finally {
    await app.close();
  }
});
