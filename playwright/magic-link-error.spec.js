import { test, expect } from '@playwright/test';
import { createTestServer, defaultSeedData } from '../test/support/test-server.js';

test('GET /auth/magic-link with an expired token renders the React recovery screen', async ({ page }) => {
  const app = await createTestServer({
    seedData: {
      ...defaultSeedData,
      magicLinks: [
        {
          token: 'expired-token',
          email: 'owner@example.com',
          memberId: 'member-1',
          expiresAt: '2000-01-01T00:00:00.000Z',
          consumedAt: null,
        },
      ],
    },
  });

  try {
    await page.goto(`${app.baseUrl}/auth/magic-link?token=expired-token`);

    await expect(page.locator('[data-react-screen="magic-link-error"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'This link has expired' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Request a new magic link' })).toHaveAttribute('href', '/sign-in');
  } finally {
    await app.close();
  }
});
