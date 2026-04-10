function canManageWorkspaceMembers(member, workspace) {
  return Boolean(member && workspace && member.role === 'owner');
}

async function getWorkspaceOwnerContext(store, request, response, getRequestContext, redirect, sendHtml, renderWorkspaceMembersAccessDeniedPage) {
  const { member, workspace } = await getRequestContext(store, request);

  if (!workspace || !member) {
    redirect(response, '/sign-in');
    return null;
  }

  if (!canManageWorkspaceMembers(member, workspace)) {
    sendHtml(response, 200, renderWorkspaceMembersAccessDeniedPage(workspace.name));
    return null;
  }

  return { member, workspace };
}

export async function handleWorkspaceMemberRoutes({
  store,
  request,
  response,
  pathname,
  getRequestContext,
  redirect,
  sendHtml,
  renderWorkspaceMembersPage,
  renderWorkspaceMembersAccessDeniedPage,
}) {
  if (request.method === 'GET' && pathname === '/workspace/members') {
    const context = await getWorkspaceOwnerContext(
      store,
      request,
      response,
      getRequestContext,
      redirect,
      sendHtml,
      renderWorkspaceMembersAccessDeniedPage,
    );

    if (!context) {
      return true;
    }

    const members = await store.listMembersByWorkspaceId(context.workspace.id);
    sendHtml(response, 200, renderWorkspaceMembersPage(context.workspace, members));
    return true;
  }

  const removeMatch = request.method === 'POST' ? pathname.match(/^\/workspace\/members\/([^/]+)\/remove$/) : null;

  if (!removeMatch) {
    return false;
  }

  const context = await getWorkspaceOwnerContext(
    store,
    request,
    response,
    getRequestContext,
    redirect,
    sendHtml,
    renderWorkspaceMembersAccessDeniedPage,
  );

  if (!context) {
    return true;
  }

  const memberId = decodeURIComponent(removeMatch[1]);
  const members = await store.listMembersByWorkspaceId(context.workspace.id);
  const targetMember = members.find((workspaceMember) => workspaceMember.id === memberId);

  if (!targetMember) {
    redirect(response, '/workspace/members');
    return true;
  }

  if (targetMember.role === 'owner' && members.filter((workspaceMember) => workspaceMember.role === 'owner').length === 1) {
    sendHtml(response, 200, renderWorkspaceMembersPage(context.workspace, members, { error: 'At least one owner must remain in the workspace.' }));
    return true;
  }

  await store.removeMember(memberId);
  redirect(response, '/workspace/members');
  return true;
}
