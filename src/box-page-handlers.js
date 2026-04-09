import { findActiveWorkspaceBox, getBoxCodeFromPath, getBoxPath } from './box-utils.js';
import { renderBoxPage } from './pages.js';
import { validateItemInput } from './item-utils.js';
import { getBoxPageOptions, getCreateItemInput, getItemValues, isBoxAtItemLimit } from './box-items.js';

async function findWorkspaceBox(store, workspaceId, pathname) {
  const boxCode = getBoxCodeFromPath(pathname);
  return findActiveWorkspaceBox(store, workspaceId, boxCode);
}

export async function handleCreateBoxItemRequest({
  store,
  workspaceId,
  pathname,
  request,
  response,
  readFormBody,
  sendHtml,
  redirect,
  sendNotFound,
}) {
  const box = await findWorkspaceBox(store, workspaceId, pathname);

  if (!box) {
    sendNotFound(response);
    return;
  }

  const form = await readFormBody(request);
  const itemValues = getItemValues(form);
  const errors = validateItemInput(itemValues);
  const boxPageOptions = await getBoxPageOptions(store, box);

  if (isBoxAtItemLimit(boxPageOptions.items)) {
    sendHtml(response, 200, renderBoxPage(box, boxPageOptions));
    return;
  }

  if (Object.keys(errors).length > 0) {
    sendHtml(response, 200, renderBoxPage(box, { ...boxPageOptions, itemValues, itemErrors: errors }));
    return;
  }

  const createdItem = await store.createItem(box.id, getCreateItemInput(itemValues));

  if (!createdItem) {
    const updatedBoxPageOptions = await getBoxPageOptions(store, box);
    sendHtml(response, 200, renderBoxPage(box, updatedBoxPageOptions));
    return;
  }

  redirect(response, getBoxPath(box.boxCode));
}

export async function handleGetBoxPageRequest({ store, workspaceId, pathname, response, sendHtml, sendNotFound }) {
  const box = await findWorkspaceBox(store, workspaceId, pathname);

  if (!box) {
    sendNotFound(response);
    return;
  }

  const boxPageOptions = await getBoxPageOptions(store, box);
  sendHtml(response, 200, renderBoxPage(box, boxPageOptions));
}
