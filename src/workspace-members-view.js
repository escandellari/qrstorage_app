import { escapeHtml, renderPage } from './html.js';

export function renderWorkspaceMembersPage(workspace, members, options = {}) {
  const memberList = members
    .map(
      (member) => `
        <li>
          <p>${escapeHtml(member.email)}</p>
          <p>${escapeHtml(member.role)}</p>
          <form method="post" action="/workspace/members/${encodeURIComponent(member.id)}/remove">
            <button type="submit">Remove member</button>
          </form>
        </li>
      `,
    )
    .join('');

  return renderPage({
    title: 'Workspace members',
    body: `
      <main>
        <h1>Workspace members</h1>
        <p>${escapeHtml(workspace.name)}</p>
        ${options.message ? `<p>${escapeHtml(options.message)}</p>` : ''}
        ${options.error ? `<p>${escapeHtml(options.error)}</p>` : ''}
        <ul>${memberList}</ul>
      </main>
    `,
  });
}

export function renderWorkspaceMembersAccessDeniedPage(workspaceName) {
  return renderPage({
    title: 'Workspace members',
    body: `
      <main>
        <h1>Workspace members</h1>
        <p>You are signed into ${escapeHtml(workspaceName)}.</p>
        <p>Only the workspace owner can manage members. Contact the owner for access.</p>
        <p><a href="/inventory">Back to inventory</a></p>
      </main>
    `,
  });
}
