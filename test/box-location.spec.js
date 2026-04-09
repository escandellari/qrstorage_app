import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';
import { defaultBox } from './support/box-items.js';

test('PATCH /boxes/:boxCode with structured location saves and renders one ordered summary', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      boxes: [defaultBox],
    },
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const updateResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      method: 'PATCH',
      redirect: 'manual',
      headers: {
        cookie: sessionCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'Camping Kit',
        location: 'Garage shelf',
        locationMode: 'structured',
        locationSite: 'Home Base',
        locationRoom: 'Garage',
        locationArea: 'North wall',
        locationShelf: 'Top shelf',
        notes: '',
      }),
    });

    assert.equal(updateResponse.status, 302);
    assert.equal(updateResponse.headers.get('location'), '/boxes/BOX-0042');

    const detailResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await detailResponse.text();

    assert.equal(detailResponse.status, 200);
    assert.match(html, /<strong>Location<\/strong>: Home Base · Garage · North wall · Top shelf/i);
    assert.doesNotMatch(html, /<strong>Location<\/strong>: Garage shelf/i);
  } finally {
    await app.close();
  }
});
