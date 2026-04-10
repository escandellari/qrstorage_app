import { getPostAuthRedirectPath } from './auth.js';

export async function handleWorkspaceAccessRoutes({
  store,
  request,
  response,
  pathname,
  getRequestContext,
  readFormBody,
  redirect,
  sendHtml,
  renderRequestInvitePage,
}) {
  if (request.method === 'GET' && pathname === '/workspace/request-invite') {
    const { workspace } = await getRequestContext(store, request);

    if (!workspace) {
      redirect(response, '/sign-in');
      return true;
    }

    sendHtml(response, 200, renderRequestInvitePage(workspace.name));
    return true;
  }

  if (request.method === 'POST' && pathname === '/workspace/switch') {
    const { session, identityMember, workspace } = await getRequestContext(store, request);

    if (!session || !identityMember || !workspace) {
      redirect(response, '/sign-in');
      return true;
    }

    const form = await readFormBody(request);
    const workspaceId = String(form.get('workspaceId') ?? '');
    const targetMembership = workspaceId ? await store.findMemberByEmailAndWorkspaceId(identityMember.email, workspaceId) : null;

    if (!targetMembership) {
      redirect(response, '/inventory');
      return true;
    }

    await store.updateSessionWorkspace(session.id, workspaceId);
    const redirectPath = await getPostAuthRedirectPath(store, session.pendingReturnToPath ?? String(form.get('returnTo') ?? ''));
    await store.updateSessionPendingReturnTo(session.id, null);
    redirect(response, redirectPath);
    return true;
  }

  return false;
}
