import { findActiveBoxByCode, getBoxCodeFromPath, getBoxPath } from './box-utils.js';

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
  const member = session ? await store.findMemberById(session.memberId) : null;
  const workspace = member ? await store.findWorkspaceById(member.workspaceId) : null;

  return { session, member, workspace };
}

export function getValidatedReturnToPath(pathname) {
  if (!/^\/q\/[^/]+$/.test(pathname)) {
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
  const box = await findActiveBoxByCode(store, boxCode);

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
