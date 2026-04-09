import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, defaultSeedData, signInAs } from './support/test-server.js';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function createLabelTestApp(box) {
  return createTestServer({
    seedData: {
      ...defaultSeedData,
      boxes: [
        {
          id: 'box-1',
          workspaceId: 'workspace-1',
          notes: '',
          status: 'active',
          ...box,
        },
      ],
    },
  });
}

async function fetchLabelHtml(app, boxCode, headers = {}) {
  const sessionCookie = await signInAs(app, 'owner@example.com');
  const response = await fetch(`${app.baseUrl}/boxes/${boxCode}/label`, {
    headers: { cookie: sessionCookie, ...headers },
  });

  return {
    response,
    html: await response.text(),
  };
}

test('GET /boxes/:boxCode/label renders a printable label with the box code and QR payload for the QR entry URL', async () => {
  const app = await createLabelTestApp({
    boxCode: 'BOX-0042',
    name: 'Camping Kit',
    locationSummary: 'Garage shelf',
    notes: 'Check stove fuel before summer.',
  });

  try {
    const { response, html } = await fetchLabelHtml(app, 'BOX-0042');

    assert.equal(response.status, 200);
    assert.match(html, /BOX-0042/);
    assert.match(html, new RegExp(escapeRegExp(`${app.baseUrl}/q/BOX-0042`)));
    assert.match(html, /<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/i);
    assert.doesNotMatch(html, />Inventory</i);
    assert.doesNotMatch(html, />Print label</i);
  } finally {
    await app.close();
  }
});

test('GET /boxes/:boxCode/label includes print-focused styling and shows the box name and location summary when present', async () => {
  const app = await createLabelTestApp({
    boxCode: 'BOX-0099',
    name: 'Winter Clothes',
    locationSummary: 'Hall cupboard',
    notes: 'Vacuum bags on top.',
  });

  try {
    const { response, html } = await fetchLabelHtml(app, 'BOX-0099');

    assert.equal(response.status, 200);
    assert.match(html, /Winter Clothes/);
    assert.match(html, /Hall cupboard/);
    assert.match(html, /@media print/);
  } finally {
    await app.close();
  }
});

test('GET /boxes/:boxCode/label omits the location line cleanly when no location summary is saved', async () => {
  const app = await createLabelTestApp({
    boxCode: 'BOX-0100',
    name: 'Spare Cables',
    locationSummary: '',
  });

  try {
    const { response, html } = await fetchLabelHtml(app, 'BOX-0100');

    assert.equal(response.status, 200);
    assert.match(html, /Spare Cables/);
    assert.doesNotMatch(html, /<strong>Location<\/strong>/i);
  } finally {
    await app.close();
  }
});

test('GET /boxes/:boxCode/label keeps key identifiers present for boxes with long names', async () => {
  const app = await createLabelTestApp({
    boxCode: 'BOX-0101',
    name: 'Very long seasonal decorations and camping accessories box for the attic shelves',
    locationSummary: 'Attic shelves',
  });

  try {
    const { response, html } = await fetchLabelHtml(app, 'BOX-0101');

    assert.equal(response.status, 200);
    assert.match(html, /Very long seasonal decorations and camping accessories box for the attic shelves/);
    assert.match(html, /BOX-0101/);
    assert.match(html, new RegExp(escapeRegExp(`${app.baseUrl}/q/BOX-0101`)));
  } finally {
    await app.close();
  }
});

test('GET /boxes/:boxCode/label re-renders the same permanent box code and QR target on later requests', async () => {
  const app = await createLabelTestApp({
    boxCode: 'BOX-0101',
    name: 'Garden Tools',
    locationSummary: 'Shed wall rack',
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const labelUrl = `${app.baseUrl}/boxes/BOX-0101/label`;
    const [firstResponse, secondResponse] = await Promise.all([
      fetch(labelUrl, { headers: { cookie: sessionCookie } }),
      fetch(labelUrl, { headers: { cookie: sessionCookie } }),
    ]);
    const [firstHtml, secondHtml] = await Promise.all([firstResponse.text(), secondResponse.text()]);
    const expectedTarget = `${app.baseUrl}/q/BOX-0101`;
    const targetPattern = new RegExp(escapeRegExp(expectedTarget), 'g');

    assert.equal(firstResponse.status, 200);
    assert.equal(secondResponse.status, 200);
    assert.equal(firstHtml.match(targetPattern)?.[0], expectedTarget);
    assert.equal(secondHtml.match(targetPattern)?.[0], expectedTarget);
    assert.match(firstHtml, /BOX-0101/);
    assert.match(secondHtml, /BOX-0101/);
  } finally {
    await app.close();
  }
});

test('GET /boxes/:boxCode/label uses the configured canonical base URL instead of the request Host header', async () => {
  const secureBaseUrl = 'https://inventory.example.com';
  const app = await createTestServer({
    baseUrl: secureBaseUrl,
    seedData: {
      ...defaultSeedData,
      boxes: [
        {
          id: 'box-1',
          workspaceId: 'workspace-1',
          boxCode: 'BOX-0110',
          name: 'Important Papers',
          locationSummary: 'Office cabinet',
          notes: '',
          status: 'active',
        },
      ],
    },
  });

  try {
    const { response, html } = await fetchLabelHtml(app, 'BOX-0110', { host: 'attacker.example.test' });

    assert.equal(response.status, 200);
    assert.match(html, new RegExp(escapeRegExp(`${secureBaseUrl}/q/BOX-0110`)));
    assert.doesNotMatch(html, /attacker\.example\.test/i);
  } finally {
    await app.close();
  }
});
