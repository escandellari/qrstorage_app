import { renderReactShellPage } from '../react-shell/renderReactShellPage.js';
import { renderInventoryHomeApp } from './InventoryHomeApp.js';

export function renderInventoryHome(workspace, options = {}) {
  const pageModel = {
    screen: 'inventory-home',
    workspaceName: workspace.name,
    boxes: options.boxes ?? [],
    boxValues: options.boxValues ?? {},
    boxErrors: options.boxErrors ?? {},
    inviteValues: options.inviteValues ?? {},
    inviteMessage: options.inviteMessage ?? '',
    inviteError: options.inviteError ?? '',
  };
  return renderReactShellPage({
    title: 'Inventory',
    pageModel,
    app: renderInventoryHomeApp,
  });
}
