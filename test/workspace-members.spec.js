import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer, signInAs } from './support/test-server.js';
import { createWorkspaceMember, createWorkspaceMembersSeedData } from './support/workspace-members.js';

test('GET /workspace/members as an owner renders current members and their roles', async () => {
  const app = await createTestServer({
    seedData: createWorkspaceMembersSeedData({
      members: [createWorkspaceMember()],
    }),
  });

  try {
    const sessionCookie = await signInAs(app, 'owner@example.com');
    const response = await fetch(`${app.baseUrl}/workspace/members`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /workspace members/i);
    assert.match(html, /owner@example\.com/i);
    assert.match(html, /member@example\.com/i);
    assert.match(html, /owner/i);
    assert.match(html, /member/i);
    assert.match(html, /action="\/workspace\/members\/member-2\/remove"/i);
  } finally {
    await app.close();
  }
});

test('GET /workspace/members as a member shows a friendly owner-only permission message', async () => {
  const app = await createTestServer({
    seedData: createWorkspaceMembersSeedData({
      members: [createWorkspaceMember()],
    }),
  });

  try {
    const sessionCookie = await signInAs(app, 'member@example.com');
    const response = await fetch(`${app.baseUrl}/workspace/members`, {
      headers: { cookie: sessionCookie },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /only the workspace owner can manage members/i);
    assert.match(html, /contact the owner for access/i);
    assert.doesNotMatch(html, /owner@example\.com/i);
    assert.doesNotMatch(html, /action="\/workspace\/members\/member-1\/remove"/i);
  } finally {
    await app.close();
  }
});
