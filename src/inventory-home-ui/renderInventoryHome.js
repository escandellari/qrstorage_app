import React from 'react';
import { renderToString } from 'react-dom/server';
import { renderPage, renderPageModelScript } from '../html.js';
import { INVENTORY_SHELL_MODEL_ID, INVENTORY_SHELL_ROOT_ID, REACT_SHELL_ASSET_PATHS } from '../react-shell/constants.js';
import { renderInventoryHomeApp } from './InventoryHomeApp.js';

export function renderInventoryHome(workspace, options = {}) {
  const pageModel = {
    workspaceName: workspace.name,
    boxes: options.boxes ?? [],
    boxValues: options.boxValues ?? {},
    boxErrors: options.boxErrors ?? {},
    inviteValues: options.inviteValues ?? {},
    inviteMessage: options.inviteMessage ?? '',
    inviteError: options.inviteError ?? '',
  };
  const body = renderToString(renderInventoryHomeApp(pageModel));

  return renderPage({
    title: 'Inventory',
    head: `
      <link rel="stylesheet" href="${REACT_SHELL_ASSET_PATHS.stylesheet}" />
      <script type="module" src="${REACT_SHELL_ASSET_PATHS.script}"></script>
      ${renderPageModelScript(INVENTORY_SHELL_MODEL_ID, pageModel)}
    `,
    body: `<div id="${INVENTORY_SHELL_ROOT_ID}">${body}</div>`,
  });
}
