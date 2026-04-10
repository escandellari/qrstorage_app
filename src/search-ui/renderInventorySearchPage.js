import { renderReactShellPage } from '../react-shell/renderReactShellPage.js';
import { renderInventorySearchApp } from './InventorySearchApp.js';

export function renderInventorySearchPage(workspace, search) {
  const pageModel = {
    screen: 'inventory-search',
    workspaceName: workspace.name,
    search,
  };
  return renderReactShellPage({
    title: `Search inventory for ${search.query}`,
    pageModel,
    app: renderInventorySearchApp,
  });
}
