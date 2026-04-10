import { findViewableBoxByCode, getBoxCodeFromPath, getBoxPath } from './box-utils.js';

function parseCookies(request) {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return {};
  }

  return Object.fromEntries(
    cookieHeader.split(';').map((pair) => {
      const [name, ...value] = pair.trim().split('=');
      return [name, value.join('=')];
    }),
  );
}

export async function getRequestContext(store, request) {
  const cookies = parseCookies(request);
  const session = cookies.session ? await store.findSession(cookies.session) : null;
  const identityMember = session ? await store.findMemberById(session.memberId) : null;
  const activeWorkspaceId = session?.activeWorkspaceId ?? identityMember?.workspaceId ?? null;
  const workspace = activeWorkspaceId ? await store.findWorkspaceById(activeWorkspaceId) : null;
  const member =
    identityMember && activeWorkspaceId
      ? (identityMember.workspaceId === activeWorkspaceId
          ? identityMember
          : await store.findMemberByEmailAndWorkspaceId(identityMember.email, activeWorkspaceId))
      : null;

  return { session, member, workspace, identityMember };
}

export function getValidatedReturnToPath(pathname) {
  if (!/^\/(q|boxes)\/[^/]+$/.test(pathname)) {
    return '';
  }

  return pathname;
}

export async function getPostAuthRedirectPath(store, returnToPath) {
  const validatedPath = getValidatedReturnToPath(returnToPath);

  if (!validatedPath) {
    return '/inventory';
  }

  const boxCode = getBoxCodeFromPath(validatedPath);
  const box = await findViewableBoxByCode(store, boxCode);

  if (!box) {
    return '/inventory';
  }

  return getBoxPath(box.boxCode);
}

export async function requireWorkspace(store, request, response, redirect) {
  const { workspace } = await getRequestContext(store, request);

  if (!workspace) {
    redirect(response, '/sign-in');
    return null;
  }

  return workspace;
}
