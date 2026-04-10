import { randomUUID } from 'node:crypto';
import { renderAuthScreen } from './renderAuthScreen.js';

const MAGIC_LINK_LIFETIME_MS = 15 * 60 * 1000;

function queueMagicLinkEmail(sentEmails, email, magicLinkToken) {
  sentEmails.push({
    id: randomUUID(),
    to: email,
    magicLinkUrl: `/auth/magic-link?token=${magicLinkToken}`,
  });
}

export async function handleAuthRoutes({
  store,
  request,
  response,
  url,
  sentEmails,
  readFormBody,
  sendHtml,
  redirect,
  getValidatedReturnToPath,
  getPostAuthRedirectPath,
}) {
  if (request.method === 'GET' && url.pathname === '/sign-in') {
    const returnTo = getValidatedReturnToPath(url.searchParams.get('returnTo') ?? '');
    const message = returnTo ? 'Access is required. Sign in to continue.' : 'Enter your email to continue.';

    sendHtml(response, 200, renderAuthScreen('sign-in', { returnTo, message }));
    return true;
  }

  if (request.method === 'GET' && /^\/invites\/[^/]+$/.test(url.pathname)) {
    const inviteToken = decodeURIComponent(url.pathname.split('/')[2] ?? '');
    const invite = inviteToken ? await store.findInvite(inviteToken) : null;

    if (!invite || new Date(invite.expiresAt).getTime() <= Date.now()) {
      sendHtml(response, 200, renderAuthScreen('invite-error'));
      return true;
    }

    const magicLink = await store.createMagicLink(
      invite.email,
      null,
      new Date(Date.now() + MAGIC_LINK_LIFETIME_MS).toISOString(),
      invite.returnTo ?? '/inventory',
      invite.token,
    );
    queueMagicLinkEmail(sentEmails, invite.email, magicLink.token);
    sendHtml(response, 200, renderAuthScreen('check-email'));
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/sign-in') {
    const form = await readFormBody(request);
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const member = email ? await store.findMemberByEmail(email) : null;
    const returnTo = await getPostAuthRedirectPath(store, String(form.get('returnTo') ?? ''));

    if (member) {
      const magicLink = await store.createMagicLink(email, member.id, new Date(Date.now() + MAGIC_LINK_LIFETIME_MS).toISOString(), returnTo);
      queueMagicLinkEmail(sentEmails, email, magicLink.token);
    }

    sendHtml(response, 200, renderAuthScreen('check-email'));
    return true;
  }

  if (request.method === 'GET' && url.pathname === '/auth/magic-link') {
    const token = url.searchParams.get('token');
    const magicLink = token ? await store.consumeMagicLink(token, new Date().toISOString()) : null;

    if (!magicLink) {
      sendHtml(response, 200, renderAuthScreen('magic-link-error'));
      return true;
    }

    let memberId = magicLink.memberId;
    let redirectPath = magicLink.returnTo ?? '/inventory';

    if (magicLink.inviteToken) {
      const invite = await store.findInvite(magicLink.inviteToken);

      if (!invite || new Date(invite.expiresAt).getTime() <= Date.now()) {
        sendHtml(response, 200, renderAuthScreen('invite-error'));
        return true;
      }

      const member = await store.createMember(invite.workspaceId, invite.email);
      await store.markInviteAccepted(invite.token, new Date().toISOString());
      memberId = member.id;
      redirectPath = invite.returnTo ?? redirectPath;
    }

    const activeWorkspaceId = memberId ? (await store.findMemberById(memberId))?.workspaceId ?? null : null;
    const session = await store.createSession(memberId, activeWorkspaceId);
    redirect(response, redirectPath, {
      'set-cookie': `session=${session.id}; Path=/; HttpOnly; SameSite=Lax`,
    });
    return true;
  }

  return false;
}
