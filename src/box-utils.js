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

function isActiveBox(box) {
  return box?.status === 'active';
}

export async function findActiveWorkspaceBox(store, workspaceId, boxCode) {
  const box = await store.findBoxByCode(boxCode);

  if (!isActiveBox(box) || box.workspaceId !== workspaceId) {
    return null;
  }

  return box;
}

export async function findActiveBoxByCode(store, boxCode) {
  const box = await store.findBoxByCode(boxCode);
  return isActiveBox(box) ? box : null;
}
