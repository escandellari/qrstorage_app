import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';

test('POST /boxes with valid input creates a box and redirects to its detail page', async () => {
  const app = await createTestServer({ seedData: defaultSeedData });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');

    const createResponse = await fetch(`${app.baseUrl}/boxes`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        cookie: sessionCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'Winter Clothes',
        location: 'Hall cupboard',
        notes: 'Vacuum bags on top.',
      }),
    });

    assert.equal(createResponse.status, 302);
    const location = createResponse.headers.get('location');
    assert.match(location, /^\/boxes\/[A-Z0-9-]+$/);

    const detailResponse = await fetch(`${app.baseUrl}${location}`, {
      headers: { cookie: sessionCookie },
    });
    const html = await detailResponse.text();

    assert.equal(detailResponse.status, 200);
    assert.match(html, /Winter Clothes/);
    assert.match(html, /Hall cupboard/);
    assert.match(html, /Vacuum bags on top\./);
    assert.match(html, /Box code/i);
    assert.match(html, new RegExp(location.slice('/boxes/'.length)));
  } finally {
    await app.close();
  }
});

test('POST /boxes with invalid input re-renders the form with inline errors', async () => {
  const app = await createTestServer({ seedData: defaultSeedData });
  const cases = [
    {
      form: { name: '', location: 'Hall cupboard', notes: '' },
      expectedError: /Enter a box name/i,
    },
    {
      form: { name: 'x'.repeat(81), location: '', notes: '' },
      expectedError: /Box name must be 80 characters or fewer/i,
    },
    {
      form: { name: 'Winter Clothes', location: '', notes: 'x'.repeat(1001) },
      expectedError: /Notes must be 1000 characters or fewer/i,
    },
  ];

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');

    for (const testCase of cases) {
      const response = await fetch(`${app.baseUrl}/boxes`, {
        method: 'POST',
        headers: {
          cookie: sessionCookie,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(testCase.form),
      });
      const html = await response.text();

      assert.equal(response.status, 200);
      assert.match(html, /<form[^>]*action="\/boxes"/);
      assert.match(html, testCase.expectedError);
      assert.match(html, /No boxes yet\./);
    }
  } finally {
    await app.close();
  }
});

test('creating two boxes with the same name still assigns distinct permanent box codes', async () => {
  const app = await createTestServer({ seedData: defaultSeedData });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const createBox = async () =>
      fetch(`${app.baseUrl}/boxes`, {
        method: 'POST',
        redirect: 'manual',
        headers: {
          cookie: sessionCookie,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          name: 'Archive box',
          location: '',
          notes: '',
        }),
      });

    const firstResponse = await createBox();
    const secondResponse = await createBox();
    const firstLocation = firstResponse.headers.get('location');
    const secondLocation = secondResponse.headers.get('location');

    assert.equal(firstResponse.status, 302);
    assert.equal(secondResponse.status, 302);
    assert.notEqual(firstLocation, secondLocation);

    const [firstDetail, secondDetail] = await Promise.all([
      fetch(`${app.baseUrl}${firstLocation}`, { headers: { cookie: sessionCookie } }),
      fetch(`${app.baseUrl}${secondLocation}`, { headers: { cookie: sessionCookie } }),
    ]);
    const [firstHtml, secondHtml] = await Promise.all([firstDetail.text(), secondDetail.text()]);

    assert.match(firstHtml, new RegExp(firstLocation.slice('/boxes/'.length)));
    assert.match(secondHtml, new RegExp(secondLocation.slice('/boxes/'.length)));
  } finally {
    await app.close();
  }
});
