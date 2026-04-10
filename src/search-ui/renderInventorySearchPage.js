import React from 'react';
import { renderToString } from 'react-dom/server';
import { renderPage, renderPageModelScript } from '../html.js';
import { INVENTORY_SHELL_MODEL_ID, INVENTORY_SHELL_ROOT_ID, REACT_SHELL_ASSET_PATHS } from '../react-shell/constants.js';
import { renderInventorySearchApp } from './InventorySearchApp.js';

export function renderInventorySearchPage(workspace, search) {
  const pageModel = {
    screen: 'inventory-search',
    workspaceName: workspace.name,
    search,
  };
  const body = renderToString(renderInventorySearchApp(pageModel));

  return renderPage({
    title: `Search inventory for ${search.query}`,
    head: `
      <link rel="stylesheet" href="${REACT_SHELL_ASSET_PATHS.stylesheet}" />
      <script type="module" src="${REACT_SHELL_ASSET_PATHS.script}"></script>
      ${renderPageModelScript(INVENTORY_SHELL_MODEL_ID, pageModel)}
    `,
    body: `<div id="${INVENTORY_SHELL_ROOT_ID}">${body}</div>`,
  });
}
