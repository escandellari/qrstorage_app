import { signInAs } from './test-server.js';

export async function createWorkspaceInvite(app, { actingEmail = 'owner@example.com', email, returnTo = '' }) {
  const sessionCookie = await signInAs(app, actingEmail);
  const response = await fetch(`${app.baseUrl}/workspace/invites`, {
    method: 'POST',
    headers: {
      cookie: sessionCookie,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      email,
      returnTo,
    }),
  });

  return {
    response,
    sessionCookie,
    inviteUrl: app.server.getSentEmails().at(-1)?.inviteUrl ?? null,
  };
}

export async function openInvite(app, inviteUrl) {
  const response = await fetch(`${app.baseUrl}${inviteUrl}`);

  return {
    response,
    magicLinkUrl: app.server.getSentEmails().at(-1)?.magicLinkUrl ?? null,
  };
}
