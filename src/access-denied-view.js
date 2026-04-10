import { escapeHtml, renderPage } from './html.js';

export function renderAccessDeniedPage({ currentWorkspaceName, canSwitch, targetWorkspaceId }) {
  return renderPage({
    title: 'Access denied',
    body: `
      <main>
        <h1>Access denied</h1>
        <p>You are signed into ${escapeHtml(currentWorkspaceName)}.</p>
        <p>${canSwitch ? 'Switch workspace to continue.' : 'Request an invite to continue.'}</p>
        ${
          canSwitch
            ? `<form method="post" action="/workspace/switch">
                <input type="hidden" name="workspaceId" value="${escapeHtml(targetWorkspaceId)}" />
                <button type="submit">Switch workspace</button>
              </form>`
            : `<p><a href="/workspace/request-invite">Request an invite</a></p>`
        }
      </main>
    `,
  });
}

export function renderRequestInvitePage(currentWorkspaceName) {
  return renderPage({
    title: 'Request an invite',
    body: `
      <main>
        <h1>Request an invite</h1>
        <p>You are signed into ${escapeHtml(currentWorkspaceName)}.</p>
        <p>Ask a member of the correct workspace to send you an invite.</p>
        <p><a href="/inventory">Back to inventory</a></p>
      </main>
    `,
  });
}
