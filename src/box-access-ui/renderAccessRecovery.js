import { renderReactShellPage } from '../react-shell/renderReactShellPage.js';
import { renderAccessRecoveryApp } from './AccessRecoveryApp.js';

export function renderWrongWorkspaceRecovery({ currentWorkspaceName, canSwitch, targetWorkspaceId }) {
  return renderReactShellPage({
    title: 'Access denied',
    pageModel: {
      screen: 'box-access-recovery',
      heading: 'Access denied',
      currentWorkspaceName,
      mode: canSwitch ? 'switch' : 'request-invite',
      targetWorkspaceId: canSwitch ? targetWorkspaceId : '',
    },
    app: renderAccessRecoveryApp,
  });
}

export function renderRequestInvitePage(currentWorkspaceName) {
  return renderReactShellPage({
    title: 'Request an invite',
    pageModel: {
      screen: 'box-access-recovery',
      heading: 'Request an invite',
      currentWorkspaceName,
      mode: 'request-invite-page',
      targetWorkspaceId: '',
    },
    app: renderAccessRecoveryApp,
  });
}
