import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { createDataStore } from './data-store.js';
import { getBoxPath } from './box-utils.js';
import { searchInventory } from './inventory-search.js';
import { renderInventorySearchPage } from './search-ui/renderInventorySearchPage.js';
import { handleBoxRoutes, handleLabelPageRequest, handleQrBoxRequest } from './box-routes.js';
import { handleWorkspaceAccessRoutes } from './workspace-access-routes.js';
import { handleWorkspaceMemberRoutes } from './workspace-members-routes.js';
import { handleReactShellAssetRequest } from './react-shell/assets.js';
import { renderInventoryHome } from './inventory-home-ui/renderInventoryHome.js';
import { handleAuthRoutes } from './auth-ui/handleAuthRoutes.js';
import { renderBoxNotFoundPage, renderLabelPage, validateBoxInput } from './pages.js';
import { renderAccessDeniedPage, renderRequestInvitePage } from './access-denied-view.js';
import { renderWorkspaceMembersAccessDeniedPage, renderWorkspaceMembersPage } from './workspace-members-view.js';
import { normalizeBaseUrl, readFormBody, redirect, sendHtml, sendNotFound } from './http.js';
import { getPostAuthRedirectPath, getRequestContext, getValidatedReturnToPath, requireWorkspace } from './auth.js';
export async function startServer({ dataDir, port = 0, seedData, baseUrl } = {}) {
  const store = await createDataStore(dataDir, seedData);
  const sentEmails = [];
  let resolvedBaseUrl = baseUrl ? normalizeBaseUrl(baseUrl) : null;

  async function sendInventoryHome(response, workspace, options = {}) {
    const boxes = options.boxes ?? (await store.listBoxesForWorkspace(workspace.id));
    sendHtml(response, 200, renderInventoryHome(workspace, { ...options, boxes }));
  }

  const server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');

    if (request.method === 'GET' && (await handleReactShellAssetRequest(url.pathname, response))) {
      return;
    }

    if (request.method === 'GET' && url.pathname === '/inventory') {
      const workspace = await requireWorkspace(store, request, response, redirect);

      if (!workspace) {
        return;
      }

      await sendInventoryHome(response, workspace);
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
        await sendInventoryHome(response, workspace, {
          inviteValues: { email },
          inviteError: 'Only the workspace owner can send invites. Contact the owner for access.',
        });
        return;
      }

      const invite = await store.createInvite(workspace.id, email, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), returnTo);
      sentEmails.push({
        id: randomUUID(),
        to: email,
        inviteUrl: `/invites/${invite.token}`,
      });
      await sendInventoryHome(response, workspace, { inviteMessage: 'Invite sent.', inviteValues: { email: '' } });
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
        await sendInventoryHome(response, workspace, { boxValues: { name, location, notes }, boxErrors: errors });
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

    if (
      await handleAuthRoutes({
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
      })
    ) {
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
