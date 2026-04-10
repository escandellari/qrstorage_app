import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';
import { defaultBox } from './support/box-items.js';

test('GET /boxes/:boxCode renders a box edit form with simple location by default and hidden structured location controls', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      boxes: [defaultBox],
    },
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /<form[^>]*action="\/boxes\/BOX-0042"/i);
    assert.match(html, /name="name"/i);
    assert.match(html, /name="location"/i);
    assert.match(html, /name="notes"/i);
    assert.match(html, /Use structured location/i);
    assert.match(html, /data-structured-location-fields(?:="true")? hidden/i);
    assert.match(html, /name="locationSite"/i);
    assert.match(html, /name="locationRoom"/i);
    assert.match(html, /name="locationArea"/i);
    assert.match(html, /name="locationShelf"/i);
    assert.match(html, /data-expand-structured-location/i);
    assert.match(html, /document\.addEventListener\('click'/i);
    assert.match(html, /closest\('\[data-expand-structured-location\]'\)/i);
    assert.match(html, /querySelector\('input\[name="locationMode"\]'\)/i);
    assert.match(html, /structuredFields\.hidden = false/i);
    assert.match(html, /locationModeField\.value = 'structured'/i);
  } finally {
    await app.close();
  }
});

test('PATCH /boxes/:boxCode with valid simple-location edits updates the box and keeps the same box code', async () => {
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
        name: 'Winter Camping Kit',
        location: 'Hall cupboard',
        notes: 'Spare gloves moved to the lid pocket.',
      }),
    });

    assert.equal(updateResponse.status, 302);
    assert.equal(updateResponse.headers.get('location'), '/boxes/BOX-0042');

    const detailResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await detailResponse.text();

    assert.equal(detailResponse.status, 200);
    assert.match(html, /Winter Camping Kit/);
    assert.match(html, /Hall cupboard/);
    assert.match(html, /Spare gloves moved to the lid pocket\./);
    assert.match(html, /<strong>Box code<\/strong>: BOX-0042/i);
    assert.doesNotMatch(html, /<h1>Camping Kit<\/h1>/i);
  } finally {
    await app.close();
  }
});

test('PATCH /boxes/:boxCode with invalid box details re-renders React validation feedback, keeps entered values, and shows the notes remaining hint', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      boxes: [defaultBox],
    },
  });
  const cases = [
    {
      form: { name: '', location: 'Hall cupboard', notes: 'Packed by season.' },
      expectedError: /Enter a box name\./i,
      expectedRemaining: '983 characters remaining',
    },
    {
      form: { name: 'x'.repeat(81), location: 'Hall cupboard', notes: 'Packed by season.' },
      expectedError: /Box name must be 80 characters or fewer\./i,
      expectedRemaining: '983 characters remaining',
    },
    {
      form: { name: 'Camping Kit', location: 'Hall cupboard', notes: 'x'.repeat(1001) },
      expectedError: /Notes must be 1000 characters or fewer\./i,
      expectedRemaining: '-1 characters remaining',
    },
  ];

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');

    for (const testCase of cases) {
      const response = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
        method: 'PATCH',
        headers: {
          cookie: sessionCookie,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(testCase.form),
      });
      const html = await response.text();

      assert.equal(response.status, 200);
      assert.match(html, /data-react-screen="box-page"/i);
      assert.match(html, testCase.expectedError);
      assert.match(html, /<label>Box name<input/i);
      assert.match(html, /<label>Location<input/i);
      assert.match(html, /<label>Notes<textarea/i);
      assert.match(html, new RegExp(`value="${testCase.form.location}"`));
      assert.match(html, new RegExp(testCase.expectedRemaining));
      assert.doesNotMatch(html, /<strong>Location<\/strong>: Hall cupboard/i);
    }
  } finally {
    await app.close();
  }
});

test('PATCH /boxes/:boxCode with a duplicate-looking name shows a soft warning and still saves', async () => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      boxes: [
        defaultBox,
        {
          ...defaultBox,
          id: 'box-2',
          boxCode: 'BOX-0043',
          name: 'Archive Box',
          locationSummary: 'Loft',
        },
      ],
    },
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      method: 'PATCH',
      headers: {
        cookie: sessionCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'archive-box',
        location: 'Hall cupboard',
        notes: '',
      }),
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /data-react-screen="box-page"/i);
    assert.match(html, /Another box already has a similar name\./i);
    assert.match(html, /<h2>Edit box details<\/h2>/i);
    assert.match(html, /<label>Box name<input/i);
    assert.match(html, /<h1>archive-box<\/h1>/i);
    assert.match(html, /<strong>Location<\/strong>: Hall cupboard/i);
    assert.match(html, /<strong>Box code<\/strong>: BOX-0042/i);
  } finally {
    await app.close();
  }
});
