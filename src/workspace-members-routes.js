function canManageWorkspaceMembers(member, workspace) {
  return Boolean(member && workspace && member.role === 'owner');
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
  const { member, workspace } = await getRequestContext(store, request);

  if (request.method === 'GET' && pathname === '/workspace/members') {
    if (!workspace || !member) {
      redirect(response, '/sign-in');
      return true;
    }

    if (!canManageWorkspaceMembers(member, workspace)) {
      sendHtml(response, 200, renderWorkspaceMembersAccessDeniedPage(workspace.name));
      return true;
    }

    const members = await store.listMembersByWorkspaceId(workspace.id);
    sendHtml(response, 200, renderWorkspaceMembersPage(workspace, members));
    return true;
  }

  const removeMatch = request.method === 'POST' ? pathname.match(/^\/workspace\/members\/([^/]+)\/remove$/) : null;

  if (!removeMatch) {
    return false;
  }

  if (!workspace || !member) {
    redirect(response, '/sign-in');
    return true;
  }

  if (!canManageWorkspaceMembers(member, workspace)) {
    sendHtml(response, 200, renderWorkspaceMembersAccessDeniedPage(workspace.name));
    return true;
  }

  const memberId = decodeURIComponent(removeMatch[1]);
  const members = await store.listMembersByWorkspaceId(workspace.id);
  const targetMember = members.find((workspaceMember) => workspaceMember.id === memberId);

  if (!targetMember) {
    redirect(response, '/workspace/members');
    return true;
  }

  if (targetMember.role === 'owner' && members.filter((workspaceMember) => workspaceMember.role === 'owner').length === 1) {
    sendHtml(response, 200, renderWorkspaceMembersPage(workspace, members, { error: 'At least one owner must remain in the workspace.' }));
    return true;
  }

  await store.removeMember(memberId);
  redirect(response, '/workspace/members');
  return true;
}
