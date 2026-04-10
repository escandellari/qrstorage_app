import { test, expect } from '@playwright/test';
import { createTestServer, defaultSeedData } from '../test/support/test-server.js';
import { createWorkspaceInvite } from '../test/support/workspace-invite.js';

test('GET /invites/:token renders React feedback for valid and expired invites', async ({ page }) => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      invites: [
        {
          token: 'expired-invite',
          workspaceId: 'workspace-1',
          email: 'expired@example.com',
          expiresAt: '2000-01-01T00:00:00.000Z',
          returnTo: '/inventory',
          acceptedAt: null,
        },
      ],
    },
  });

  try {
    const { inviteUrl } = await createWorkspaceInvite(app, {
      email: 'invitee@example.com',
      returnTo: '/boxes/BOX-1',
    });

    await page.goto(`${app.baseUrl}${inviteUrl}`);

    await expect(page.locator('[data-react-screen="check-email"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Check your email', exact: true })).toBeVisible();
    await expect(page.getByText('If that email can access this workspace, we have sent a magic link.')).toBeVisible();
    await expect(page.getByText('invitee@example.com')).toHaveCount(0);

    await page.goto(`${app.baseUrl}/invites/expired-invite`);

    await expect(page.locator('[data-react-screen="invite-error"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'This invite link has expired' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Request a new invite' })).toHaveAttribute('href', '/sign-in');
  } finally {
    await app.close();
  }
});
