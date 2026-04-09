export function getBoxPath(boxCode) {
  return `/boxes/${encodeURIComponent(boxCode)}`;
}

export function getLabelPath(boxCode) {
  return `${getBoxPath(boxCode)}/label`;
}

export function getQrPath(boxCode) {
  return `/q/${encodeURIComponent(boxCode)}`;
}

export function getBoxCodeFromPath(pathname) {
  return decodeURIComponent(pathname.split('/')[2] ?? '');
}

export function isActiveBox(box) {
  return box?.status === 'active';
}

export function isArchivedBox(box) {
  return box?.status === 'archived';
}

export function isViewableBox(box) {
  return isActiveBox(box) || isArchivedBox(box);
}

export async function findWorkspaceBoxByCode(store, workspaceId, boxCode) {
  const box = await store.findBoxByCode(boxCode);

  if (!isViewableBox(box) || box.workspaceId !== workspaceId) {
    return null;
  }

  return box;
}

export async function findActiveWorkspaceBox(store, workspaceId, boxCode) {
  const box = await findWorkspaceBoxByCode(store, workspaceId, boxCode);
  return isActiveBox(box) ? box : null;
}

export async function findViewableBoxByCode(store, boxCode) {
  const box = await store.findBoxByCode(boxCode);
  return isViewableBox(box) ? box : null;
}

export async function findActiveBoxByCode(store, boxCode) {
  const box = await findViewableBoxByCode(store, boxCode);
  return isActiveBox(box) ? box : null;
}
