import { findActiveWorkspaceBox, getBoxCodeFromPath, getBoxPath } from './box-utils.js';
import { renderBoxPage } from './pages.js';
import { validateItemInput } from './item-utils.js';
import { getBoxPageOptions, getCreateItemInput, getItemValues, getOriginalItemValues, getUpdateItemInput, isBoxAtItemLimit } from './box-items.js';

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
  form,
}) {
  const box = await findWorkspaceBox(store, workspaceId, pathname);

  if (!box) {
    sendNotFound(response);
    return;
  }

  const resolvedForm = form ?? (await readFormBody(request));
  const itemValues = getItemValues(resolvedForm);
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

export async function handleUpdateBoxItemRequest({
  store,
  workspaceId,
  pathname,
  itemId,
  request,
  response,
  readFormBody,
  sendHtml,
  redirect,
  sendNotFound,
  form,
}) {
  const box = await findWorkspaceBox(store, workspaceId, pathname);

  if (!box) {
    sendNotFound(response);
    return;
  }

  const resolvedForm = form ?? (await readFormBody(request));
  const itemValues = getItemValues(resolvedForm);
  const originalItemValues = getOriginalItemValues(resolvedForm);
  const errors = validateItemInput(itemValues);
  const boxPageOptions = await getBoxPageOptions(store, box);

  if (Object.keys(errors).length > 0) {
    sendHtml(
      response,
      200,
      renderBoxPage(box, {
        ...boxPageOptions,
        editItemId: itemId,
        editItemValues: itemValues,
        editItemErrors: errors,
        editOriginalItemValues: originalItemValues,
      }),
    );
    return;
  }

  const updateResult = await store.updateItem(box.id, itemId, getUpdateItemInput(itemValues), getUpdateItemInput(originalItemValues));

  if (updateResult.status === 'deleted') {
    sendHtml(response, 200, renderBoxPage(box, { ...boxPageOptions, removedItemMessage: 'This item was removed before you could save your changes.' }));
    return;
  }

  if (updateResult.status === 'conflict') {
    sendHtml(
      response,
      200,
      renderBoxPage(box, {
        ...boxPageOptions,
        editItemId: itemId,
        editItemValues: itemValues,
        conflictItemId: itemId,
        conflictItem: updateResult.item,
      }),
    );
    return;
  }

  redirect(response, getBoxPath(box.boxCode));
}

export async function handleDeleteBoxItemRequest({
  store,
  workspaceId,
  pathname,
  itemId,
  response,
  redirect,
  sendNotFound,
}) {
  const box = await findWorkspaceBox(store, workspaceId, pathname);

  if (!box) {
    sendNotFound(response);
    return;
  }

  const deletedItem = await store.deleteItem(box.id, itemId);

  if (!deletedItem) {
    sendNotFound(response);
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
