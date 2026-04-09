import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';

test('GET /boxes/:boxCode for an empty box shows the add-first-item prompt and form', async () => {
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
    const response = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Add the first item/i);
    assert.match(html, /<form[^>]*action="\/boxes\/BOX-0042\/items"/i);
    assert.match(html, /name="name"/i);
    assert.match(html, /name="quantity"/i);
    assert.match(html, /name="category"/i);
    assert.match(html, /name="notes"/i);
  } finally {
    await app.close();
  }
});

test('POST /boxes/:boxCode/items with valid input adds an item and shows it on the box page', async () => {
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
    const createResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042/items`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        cookie: sessionCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'Tent pegs',
        quantity: '',
        category: '',
        notes: '',
      }),
    });

    assert.equal(createResponse.status, 302);
    assert.equal(createResponse.headers.get('location'), '/boxes/BOX-0042');

    const detailResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await detailResponse.text();

    assert.equal(detailResponse.status, 200);
    assert.match(html, /Contents/i);
    assert.match(html, /Tent pegs/);
  } finally {
    await app.close();
  }
});

test('POST /boxes/:boxCode/items saves optional quantity, category, and notes when supplied', async () => {
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
    const createResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042/items`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        cookie: sessionCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'Tent pegs',
        quantity: '12',
        category: 'Camping',
        notes: 'Stored in a mesh bag.',
      }),
    });

    assert.equal(createResponse.status, 302);

    const detailResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const html = await detailResponse.text();

    assert.equal(detailResponse.status, 200);
    assert.match(html, /Tent pegs/);
    assert.match(html, /12/);
    assert.match(html, /Camping/);
    assert.match(html, /Stored in a mesh bag\./);
  } finally {
    await app.close();
  }
});

test('POST /boxes/:boxCode/items with invalid input re-renders inline plain-language errors', async () => {
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
  const cases = [
    {
      form: { name: '', quantity: '', category: '', notes: '' },
      expectedError: /Enter an item name\./i,
    },
    {
      form: { name: 'Tent pegs', quantity: '1.5', category: '', notes: '' },
      expectedError: /Enter a whole number between 1 and 9,999\./i,
    },
    {
      form: { name: 'Tent pegs', quantity: '10000', category: '', notes: '' },
      expectedError: /Enter a whole number between 1 and 9,999\./i,
    },
    {
      form: { name: 'x'.repeat(81), quantity: '', category: '', notes: '' },
      expectedError: /Item name must be 80 characters or fewer\./i,
    },
    {
      form: { name: 'Tent pegs', quantity: '', category: 'x'.repeat(81), notes: '' },
      expectedError: /Category must be 80 characters or fewer\./i,
    },
  ];

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');

    for (const testCase of cases) {
      const response = await fetch(`${app.baseUrl}/boxes/BOX-0042/items`, {
        method: 'POST',
        headers: {
          cookie: sessionCookie,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(testCase.form),
      });
      const html = await response.text();

      assert.equal(response.status, 200);
      assert.match(html, /<form[^>]*action="\/boxes\/BOX-0042\/items"/i);
      assert.match(html, testCase.expectedError);
      assert.doesNotMatch(html, /<strong>Tent pegs<\/strong>/);
    }
  } finally {
    await app.close();
  }
});

test('a box with 500 items blocks further additions with a clear message', async () => {
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
      items: Array.from({ length: 500 }, (_, index) => ({
        id: `item-${index + 1}`,
        boxId: 'box-1',
        name: `Item ${index + 1}`,
        quantity: null,
        category: '',
        notes: '',
      })),
    },
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');

    const pageResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042`, {
      headers: { cookie: sessionCookie },
    });
    const pageHtml = await pageResponse.text();

    assert.equal(pageResponse.status, 200);
    assert.match(pageHtml, /This box already has 500 items\. Remove an item before adding another\./i);

    const createResponse = await fetch(`${app.baseUrl}/boxes/BOX-0042/items`, {
      method: 'POST',
      headers: {
        cookie: sessionCookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'Overflow item',
        quantity: '',
        category: '',
        notes: '',
      }),
    });
    const createHtml = await createResponse.text();

    assert.equal(createResponse.status, 200);
    assert.match(createHtml, /This box already has 500 items\. Remove an item before adding another\./i);
    assert.doesNotMatch(createHtml, /Overflow item/);
  } finally {
    await app.close();
  }
});
