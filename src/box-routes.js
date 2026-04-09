import QRCode from 'qrcode';
import {
  findViewableBoxByCode,
  findWorkspaceBoxByCode,
  getBoxCodeFromPath,
  getBoxPath,
  getQrPath,
} from './box-utils.js';
import {
  handleArchiveBoxRequest,
  handleCreateBoxItemRequest,
  handleDeleteBoxItemRequest,
  handleGetBoxPageRequest,
  handleRestoreBoxRequest,
  handleUpdateBoxItemRequest,
  handleUpdateBoxRequest,
} from './box-page-handlers.js';

export async function handleQrBoxRequest({
  store,
  request,
  response,
  pathname,
  getRequestContext,
  redirect,
  sendHtml,
  renderBoxNotFoundPage,
}) {
  const { workspace } = await getRequestContext(store, request);

  if (!workspace) {
    redirect(response, `/sign-in?returnTo=${encodeURIComponent(pathname)}`);
    return;
  }

  const boxCode = getBoxCodeFromPath(pathname);
  const box = await findViewableBoxByCode(store, boxCode);

  if (!box || box.workspaceId !== workspace.id) {
    sendHtml(response, 404, renderBoxNotFoundPage());
    return;
  }

  redirect(response, getBoxPath(box.boxCode));
}

export async function handleLabelPageRequest({
  store,
  request,
  response,
  pathname,
  requireWorkspace,
  redirect,
  sendHtml,
  sendNotFound,
  renderLabelPage,
  normalizeBaseUrl,
  resolvedBaseUrl,
}) {
  const workspace = await requireWorkspace(store, request, response, redirect);

  if (!workspace) {
    return;
  }

  const boxCode = getBoxCodeFromPath(pathname);
  const box = await findWorkspaceBoxByCode(store, workspace.id, boxCode);

  if (!box) {
    sendNotFound(response);
    return;
  }

  const qrTarget = `${normalizeBaseUrl(resolvedBaseUrl)}${getQrPath(box.boxCode)}`;
  const qrSvg = await QRCode.toString(qrTarget, { type: 'svg', errorCorrectionLevel: 'H', margin: 1 });

  sendHtml(response, 200, renderLabelPage(box, { qrSvg, qrTarget }));
}

export async function handleBoxRoutes({
  store,
  request,
  response,
  pathname,
  method,
  requireWorkspace,
  redirect,
  readFormBody,
  sendHtml,
  sendNotFound,
}) {
  if (method === 'POST' && /^\/boxes\/[^/]+\/items$/.test(pathname)) {
    const workspace = await requireWorkspace(store, request, response, redirect);

    if (!workspace) {
      return true;
    }

    await handleCreateBoxItemRequest({
      store,
      workspaceId: workspace.id,
      pathname,
      request,
      response,
      readFormBody,
      sendHtml,
      redirect,
      sendNotFound,
    });
    return true;
  }

  if (/^\/boxes\/[^/]+\/items\/[^/]+$/.test(pathname) && ['PATCH', 'POST'].includes(method)) {
    const workspace = await requireWorkspace(store, request, response, redirect);

    if (!workspace) {
      return true;
    }

    const form = method === 'POST' ? await readFormBody(request) : null;

    if (method === 'POST' && String(form.get('_method') ?? '').toUpperCase() !== 'PATCH') {
      sendNotFound(response);
      return true;
    }

    const [, , boxCode, , itemId] = pathname.split('/');
    await handleUpdateBoxItemRequest({
      store,
      workspaceId: workspace.id,
      pathname: `/boxes/${boxCode}`,
      itemId,
      request,
      response,
      readFormBody,
      sendHtml,
      redirect,
      sendNotFound,
      form,
    });
    return true;
  }

  if (method === 'POST' && /^\/boxes\/[^/]+\/items\/[^/]+\/delete$/.test(pathname)) {
    const workspace = await requireWorkspace(store, request, response, redirect);

    if (!workspace) {
      return true;
    }

    const [, , boxCode, , itemId] = pathname.split('/');
    await handleDeleteBoxItemRequest({
      store,
      workspaceId: workspace.id,
      pathname: `/boxes/${boxCode}`,
      itemId,
      response,
      redirect,
      sendNotFound,
    });
    return true;
  }

  if (method === 'POST' && /^\/boxes\/[^/]+\/archive$/.test(pathname)) {
    const workspace = await requireWorkspace(store, request, response, redirect);

    if (!workspace) {
      return true;
    }

    await handleArchiveBoxRequest({
      store,
      workspaceId: workspace.id,
      pathname,
      response,
      redirect,
      sendNotFound,
    });
    return true;
  }

  if (method === 'POST' && /^\/boxes\/[^/]+\/restore$/.test(pathname)) {
    const workspace = await requireWorkspace(store, request, response, redirect);

    if (!workspace) {
      return true;
    }

    await handleRestoreBoxRequest({
      store,
      workspaceId: workspace.id,
      pathname,
      response,
      redirect,
      sendNotFound,
    });
    return true;
  }

  if (/^\/boxes\/[^/]+$/.test(pathname) && ['PATCH', 'POST'].includes(method)) {
    const workspace = await requireWorkspace(store, request, response, redirect);

    if (!workspace) {
      return true;
    }

    const form = method === 'POST' ? await readFormBody(request) : null;

    if (method === 'POST' && String(form.get('_method') ?? '').toUpperCase() !== 'PATCH') {
      sendNotFound(response);
      return true;
    }

    await handleUpdateBoxRequest({
      store,
      workspaceId: workspace.id,
      pathname,
      request,
      response,
      readFormBody,
      sendHtml,
      redirect,
      sendNotFound,
      form,
    });
    return true;
  }

  if (method === 'GET' && /^\/boxes\/[^/]+$/.test(pathname)) {
    const workspace = await requireWorkspace(store, request, response, redirect);

    if (!workspace) {
      return true;
    }

    await handleGetBoxPageRequest({
      store,
      workspaceId: workspace.id,
      pathname,
      response,
      sendHtml,
      sendNotFound,
    });
    return true;
  }

  return false;
}
