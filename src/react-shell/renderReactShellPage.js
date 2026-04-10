import { renderToString } from 'react-dom/server';
import { renderPage, renderPageModelScript } from '../html.js';
import { INVENTORY_SHELL_MODEL_ID, INVENTORY_SHELL_ROOT_ID, REACT_SHELL_ASSET_PATHS } from './constants.js';

export function renderReactShellPage({ title, pageModel, app }) {
  const body = renderToString(app(pageModel));

  return renderPage({
    title,
    head: `
      <link rel="stylesheet" href="${REACT_SHELL_ASSET_PATHS.stylesheet}" />
      <script type="module" src="${REACT_SHELL_ASSET_PATHS.script}"></script>
      ${renderPageModelScript(INVENTORY_SHELL_MODEL_ID, pageModel)}
    `,
    body: `<div id="${INVENTORY_SHELL_ROOT_ID}">${body}</div>`,
  });
}
