import QRCode from 'qrcode';
import { findViewableBoxByCode, findWorkspaceBoxByCode, getBoxCodeFromPath, getBoxPath, getQrPath } from './box-utils.js';
import {
  handleArchiveBoxRequest,
  handleCreateBoxItemRequest,
  handleDeleteBoxItemRequest,
  handleGetBoxPageRequest,
  handleRestoreBoxRequest,
  handleUpdateBoxItemRequest,
  handleUpdateBoxRequest,
} from './box-page-handlers.js';

async function handleWorkspaceRoute({ store, request, response, requireWorkspace, redirect }, callback) {
  const workspace = await requireWorkspace(store, request, response, redirect);

  if (!workspace) {
    return true;
  }

  await callback(workspace);
  return true;
}

function getBoxItemPathParts(pathname) {
  const [, , boxCode, , itemId] = pathname.split('/');
  return {
    boxCode,
    itemId,
    boxPath: `/boxes/${boxCode}`,
  };
}

async function readPatchForm({ method, request, readFormBody, sendNotFound, response }) {
  const form = method === 'POST' ? await readFormBody(request) : null;

  if (method === 'POST' && String(form.get('_method') ?? '').toUpperCase() !== 'PATCH') {
    sendNotFound(response);
    return null;
  }

  return form;
}

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
  getRequestContext,
  redirect,
  readFormBody,
  sendHtml,
  sendNotFound,
  renderAccessDeniedPage,
}) {
  if (method === 'POST' && /^\/boxes\/[^/]+\/items$/.test(pathname)) {
    return handleWorkspaceRoute({ store, request, response, requireWorkspace, redirect }, async (workspace) => {
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
    });
  }

  if (/^\/boxes\/[^/]+\/items\/[^/]+$/.test(pathname) && ['PATCH', 'POST'].includes(method)) {
    return handleWorkspaceRoute({ store, request, response, requireWorkspace, redirect }, async (workspace) => {
      const form = await readPatchForm({ method, request, readFormBody, sendNotFound, response });

      if (method === 'POST' && !form) {
        return;
      }

      const { boxPath, itemId } = getBoxItemPathParts(pathname);
      await handleUpdateBoxItemRequest({
        store,
        workspaceId: workspace.id,
        pathname: boxPath,
        itemId,
        request,
        response,
        readFormBody,
        sendHtml,
        redirect,
        sendNotFound,
        form,
      });
    });
  }

  if (method === 'POST' && /^\/boxes\/[^/]+\/items\/[^/]+\/delete$/.test(pathname)) {
    return handleWorkspaceRoute({ store, request, response, requireWorkspace, redirect }, async (workspace) => {
      const { boxPath, itemId } = getBoxItemPathParts(pathname);
      await handleDeleteBoxItemRequest({
        store,
        workspaceId: workspace.id,
        pathname: boxPath,
        itemId,
        response,
        redirect,
        sendNotFound,
      });
    });
  }

  if (method === 'POST' && /^\/boxes\/[^/]+\/archive$/.test(pathname)) {
    return handleWorkspaceRoute({ store, request, response, requireWorkspace, redirect }, async (workspace) => {
      await handleArchiveBoxRequest({
        store,
        workspaceId: workspace.id,
        pathname,
        response,
        redirect,
        sendNotFound,
      });
    });
  }

  if (method === 'POST' && /^\/boxes\/[^/]+\/restore$/.test(pathname)) {
    return handleWorkspaceRoute({ store, request, response, requireWorkspace, redirect }, async (workspace) => {
      await handleRestoreBoxRequest({
        store,
        workspaceId: workspace.id,
        pathname,
        response,
        redirect,
        sendNotFound,
      });
    });
  }

  if (/^\/boxes\/[^/]+$/.test(pathname) && ['PATCH', 'POST'].includes(method)) {
    return handleWorkspaceRoute({ store, request, response, requireWorkspace, redirect }, async (workspace) => {
      const form = await readPatchForm({ method, request, readFormBody, sendNotFound, response });

      if (method === 'POST' && !form) {
        return;
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
    });
  }

  if (method === 'GET' && /^\/boxes\/[^/]+$/.test(pathname)) {
    const { session, workspace, identityMember } = await getRequestContext(store, request);

    if (!workspace) {
      redirect(response, '/sign-in');
      return true;
    }

    const boxCode = getBoxCodeFromPath(pathname);
    const box = await findViewableBoxByCode(store, boxCode);

    if (!box) {
      sendNotFound(response);
      return true;
    }

    if (box.workspaceId !== workspace.id) {
      const targetMembership = identityMember
        ? await store.findMemberByEmailAndWorkspaceId(identityMember.email, box.workspaceId)
        : null;
      if (session) {
        await store.updateSessionPendingReturnTo(session.id, pathname);
      }

      sendHtml(
        response,
        403,
        renderAccessDeniedPage({
          currentWorkspaceName: workspace.name,
          canSwitch: Boolean(targetMembership),
          targetWorkspaceId: box.workspaceId,
        }),
      );
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
