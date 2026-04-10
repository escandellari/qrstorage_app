import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createDataStore } from './data-store.js';
import { getBoxPath } from './box-utils.js';
import { searchInventory } from './inventory-search.js';
import { renderInventorySearchPage } from './inventory-search-view.js';
import { handleBoxRoutes, handleLabelPageRequest, handleQrBoxRequest } from './box-routes.js';
import { handleWorkspaceAccessRoutes } from './workspace-access-routes.js';
import { handleWorkspaceMemberRoutes } from './workspace-members-routes.js';
import {
  renderBoxNotFoundPage,
  renderCheckEmailPage,
  renderInventoryPage,
  renderInviteErrorPage,
  renderLabelPage,
  renderMagicLinkErrorPage,
  renderSignInPage,
  validateBoxInput,
} from './pages.js';
import { renderAccessDeniedPage, renderRequestInvitePage } from './access-denied-view.js';
import { renderWorkspaceMembersAccessDeniedPage, renderWorkspaceMembersPage } from './workspace-members-view.js';
import { normalizeBaseUrl, readFormBody, redirect, sendHtml, sendNotFound } from './http.js';
import { getPostAuthRedirectPath, getRequestContext, getValidatedReturnToPath, requireWorkspace } from './auth.js';
export async function startServer({ dataDir, port = 0, seedData, baseUrl } = {}) {
  const store = await createDataStore(dataDir, seedData);
  const sentEmails = [];
  let resolvedBaseUrl = baseUrl ? normalizeBaseUrl(baseUrl) : null;

  const server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');

    if (request.method === 'GET' && url.pathname === '/inventory') {
      const workspace = await requireWorkspace(store, request, response, redirect);

      if (!workspace) {
        return;
      }

      sendHtml(response, 200, renderInventoryPage(workspace));
      return;
    }

    if (request.method === 'GET' && url.pathname === '/inventory/search') {
      const workspace = await requireWorkspace(store, request, response, redirect);

      if (!workspace) {
        return;
      }

      const search = await searchInventory(store, workspace.id, {
        query: url.searchParams.get('q') ?? '',
        includeArchived: url.searchParams.get('includeArchived') === '1',
        offset: Number(url.searchParams.get('offset') ?? '0') || 0,
      });

      sendHtml(response, 200, renderInventorySearchPage(workspace, search));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/workspace/invites') {
      const { member, workspace } = await getRequestContext(store, request);

      if (!workspace) {
        redirect(response, '/sign-in');
        return;
      }

      const form = await readFormBody(request);
      const email = String(form.get('email') ?? '').trim().toLowerCase();
      const returnTo = await getPostAuthRedirectPath(store, String(form.get('returnTo') ?? ''));

      if (member.role !== 'owner') {
        sendHtml(
          response,
          200,
          renderInventoryPage(workspace, {}, {}, { inviteValues: { email }, inviteError: 'Only the workspace owner can send invites. Contact the owner for access.' }),
        );
        return;
      }

      const invite = await store.createInvite(workspace.id, email, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), returnTo);
      sentEmails.push({
        id: randomUUID(),
        to: email,
        inviteUrl: `/invites/${invite.token}`,
      });
      sendHtml(response, 200, renderInventoryPage(workspace, {}, {}, { inviteMessage: 'Invite sent.', inviteValues: { email: '' } }));
      return;
    }

    if (
      await handleWorkspaceAccessRoutes({
        store,
        request,
        response,
        pathname: url.pathname,
        getRequestContext,
        readFormBody,
        redirect,
        sendHtml,
        renderRequestInvitePage,
      })
    ) {
      return;
    }

    if (
      await handleWorkspaceMemberRoutes({
        store,
        request,
        response,
        pathname: url.pathname,
        getRequestContext,
        redirect,
        sendHtml,
        renderWorkspaceMembersPage,
        renderWorkspaceMembersAccessDeniedPage,
      })
    ) {
      return;
    }

    if (request.method === 'POST' && url.pathname === '/boxes') {
      const workspace = await requireWorkspace(store, request, response, redirect);

      if (!workspace) {
        return;
      }

      const form = await readFormBody(request);
      const name = String(form.get('name') ?? '').trim();
      const location = String(form.get('location') ?? '').trim();
      const notes = String(form.get('notes') ?? '').trim();
      const errors = validateBoxInput({ name, notes });

      if (Object.keys(errors).length > 0) {
        sendHtml(response, 200, renderInventoryPage(workspace, { name, location, notes }, errors));
        return;
      }

      const box = await store.createBox(workspace.id, {
        name,
        locationSummary: location,
        notes,
      });

      redirect(response, getBoxPath(box.boxCode));
      return;
    }

    if (request.method === 'GET' && /^\/q\/[^/]+$/.test(url.pathname)) {
      await handleQrBoxRequest({
        store,
        request,
        response,
        pathname: url.pathname,
        getRequestContext,
        redirect,
        sendHtml,
        renderBoxNotFoundPage,
      });
      return;
    }

    if (request.method === 'GET' && /^\/boxes\/[^/]+\/label$/.test(url.pathname)) {
      await handleLabelPageRequest({
        store,
        request,
        response,
        pathname: url.pathname,
        requireWorkspace,
        redirect,
        sendHtml,
        sendNotFound,
        renderLabelPage,
        normalizeBaseUrl,
        resolvedBaseUrl,
      });
      return;
    }

    if (
      await handleBoxRoutes({
        store,
        request,
        response,
        pathname: url.pathname,
        method: request.method,
        requireWorkspace,
        getRequestContext,
        redirect,
        readFormBody,
        sendHtml,
        sendNotFound,
        renderAccessDeniedPage,
      })
    ) {
      return;
    }

    if (request.method === 'GET' && url.pathname === '/sign-in') {
      const returnTo = getValidatedReturnToPath(url.searchParams.get('returnTo') ?? '');
      const message = returnTo ? 'Access is required. Sign in to continue.' : 'Enter your email to continue.';

      sendHtml(response, 200, renderSignInPage({ returnTo, message }));
      return;
    }

    if (request.method === 'GET' && /^\/invites\/[^/]+$/.test(url.pathname)) {
      const inviteToken = decodeURIComponent(url.pathname.split('/')[2] ?? '');
      const invite = inviteToken ? await store.findInvite(inviteToken) : null;

      if (!invite || new Date(invite.expiresAt).getTime() <= Date.now()) {
        sendHtml(response, 200, renderInviteErrorPage());
        return;
      }

      const magicLink = await store.createMagicLink(
        invite.email,
        null,
        new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        invite.returnTo ?? '/inventory',
        invite.token,
      );
      sentEmails.push({
        id: randomUUID(),
        to: invite.email,
        magicLinkUrl: `/auth/magic-link?token=${magicLink.token}`,
      });
      sendHtml(response, 200, renderCheckEmailPage());
      return;
    }

    if (request.method === 'POST' && url.pathname === '/sign-in') {
      const form = await readFormBody(request);
      const email = String(form.get('email') ?? '').trim().toLowerCase();
      const member = email ? await store.findMemberByEmail(email) : null;
      const returnTo = await getPostAuthRedirectPath(store, String(form.get('returnTo') ?? ''));

      if (member) {
        const magicLink = await store.createMagicLink(email, member.id, new Date(Date.now() + 15 * 60 * 1000).toISOString(), returnTo);
        sentEmails.push({
          id: randomUUID(),
          to: email,
          magicLinkUrl: `/auth/magic-link?token=${magicLink.token}`,
        });
      }

      sendHtml(response, 200, renderCheckEmailPage());
      return;
    }

    if (request.method === 'GET' && url.pathname === '/auth/magic-link') {
      const token = url.searchParams.get('token');
      const magicLink = token ? await store.consumeMagicLink(token, new Date().toISOString()) : null;

      if (!magicLink) {
        sendHtml(response, 200, renderMagicLinkErrorPage());
        return;
      }

      let memberId = magicLink.memberId;
      let redirectPath = magicLink.returnTo ?? '/inventory';

      if (magicLink.inviteToken) {
        const invite = await store.findInvite(magicLink.inviteToken);

        if (!invite || new Date(invite.expiresAt).getTime() <= Date.now()) {
          sendHtml(response, 200, renderInviteErrorPage());
          return;
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
      return;
    }

    sendNotFound(response);
  });

  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  resolvedBaseUrl ??= `http://127.0.0.1:${server.address().port}`;

  return {
    port: server.address().port,
    getSentEmails() {
      return [...sentEmails];
    },
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}
