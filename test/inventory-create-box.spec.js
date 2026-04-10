import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';

test('GET /inventory for an authenticated member renders the create-box form', async () => {
  const app = await createTestServer({ seedData: defaultSeedData });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');

    const response = await fetch(`${app.baseUrl}/inventory`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /<form[^>]*action="\/boxes"/);
    assert.match(html, /name="name"/);
    assert.match(html, /name="location"/);
    assert.match(html, /name="notes"/);
    assert.match(html, /Create box/i);
  } finally {
    await app.close();
  }
});

test('GET /inventory shows active workspace boxes instead of the empty state', async () => {
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
    const sessionCookie = await signInAs(app, 'owner@example.com');

    const response = await fetch(`${app.baseUrl}/inventory`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /href="\/boxes\/BOX-0042"/i);
    assert.match(html, /Camping Kit/);
    assert.match(html, /Garage shelf/);
    assert.doesNotMatch(html, /No boxes yet\./i);
  } finally {
    await app.close();
  }
});
