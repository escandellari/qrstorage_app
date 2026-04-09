import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
import { createDataStore } from './data-store.js';
import {
  renderBoxPage,
  renderCheckEmailPage,
  renderInventoryPage,
  renderLabelPage,
  renderMagicLinkErrorPage,
  renderSignInPage,
  validateBoxInput,
} from './pages.js';

function sendHtml(response, statusCode, html, headers = {}) {
  response.writeHead(statusCode, {
    'content-type': 'text/html; charset=utf-8',
    ...headers,
  });
  response.end(html);
}

function redirect(response, location, headers = {}) {
  response.writeHead(302, { location, ...headers });
  response.end();
}

function sendNotFound(response) {
  response.writeHead(404);
  response.end('Not found');
}

function getBaseUrl(request) {
  return `http://${request.headers.host}`;
}

function getBoxPath(boxCode) {
  return `/boxes/${encodeURIComponent(boxCode)}`;
}

function getLabelPath(boxCode) {
  return `${getBoxPath(boxCode)}/label`;
}

function getBoxUrl(request, boxCode) {
  return `${getBaseUrl(request)}${getBoxPath(boxCode)}`;
}

function getBoxCodeFromPath(pathname) {
  return decodeURIComponent(pathname.split('/')[2] ?? '');
}

async function findWorkspaceBox(store, workspaceId, boxCode) {
  const box = await store.findBoxByCode(boxCode);

  if (!box || box.workspaceId !== workspaceId) {
    return null;
  }

  return box;
}

async function readFormBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}

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

async function getRequestContext(store, request) {
  const cookies = parseCookies(request);
  const session = cookies.session ? await store.findSession(cookies.session) : null;
  const member = session ? await store.findMemberById(session.memberId) : null;
  const workspace = member ? await store.findWorkspaceById(member.workspaceId) : null;

  return { session, member, workspace };
}

async function requireWorkspace(store, request, response) {
  const { workspace } = await getRequestContext(store, request);

  if (!workspace) {
    redirect(response, '/sign-in');
    return null;
  }

  return workspace;
}

export async function startServer({ dataDir, port = 0, seedData } = {}) {
  const store = await createDataStore(dataDir, seedData);
  const sentEmails = [];

  const server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');

    if (request.method === 'GET' && url.pathname === '/inventory') {
      const workspace = await requireWorkspace(store, request, response);

      if (!workspace) {
        return;
      }

      sendHtml(response, 200, renderInventoryPage(workspace));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/boxes') {
      const workspace = await requireWorkspace(store, request, response);

      if (!workspace) {
        return;
      }

      const form = await readFormBody(request);
      const name = String(form.get('name') ?? '').trim();
      const location = String(form.get('location') ?? '').trim();
      const notes = String(form.get('notes') ?? '').trim();
      const errors = validateBoxInput({ name, notes });

      if (Object.keys(errors).length > 0) {
        sendHtml(response, 200, renderInventoryPage(workspace, { name, location, notes }, errors));
        return;
      }

      const box = await store.createBox(workspace.id, {
        name,
        locationSummary: location,
        notes,
      });

      redirect(response, getBoxPath(box.boxCode));
      return;
    }

    if (request.method === 'GET' && /^\/boxes\/[^/]+\/label$/.test(url.pathname)) {
      const workspace = await requireWorkspace(store, request, response);

      if (!workspace) {
        return;
      }

      const boxCode = getBoxCodeFromPath(url.pathname);
      const box = await findWorkspaceBox(store, workspace.id, boxCode);

      if (!box) {
        sendNotFound(response);
        return;
      }

      const qrTarget = getBoxUrl(request, box.boxCode);
      const qrSvg = await QRCode.toString(qrTarget, { type: 'svg', errorCorrectionLevel: 'H', margin: 1 });

      sendHtml(response, 200, renderLabelPage(box, { qrSvg, qrTarget }));
      return;
    }

    if (request.method === 'GET' && /^\/boxes\/[^/]+$/.test(url.pathname)) {
      const workspace = await requireWorkspace(store, request, response);

      if (!workspace) {
        return;
      }

      const boxCode = getBoxCodeFromPath(url.pathname);
      const box = await findWorkspaceBox(store, workspace.id, boxCode);

      if (!box) {
        sendNotFound(response);
        return;
      }

      sendHtml(response, 200, renderBoxPage(box, { labelPath: getLabelPath(box.boxCode) }));
      return;
    }

    if (request.method === 'GET' && url.pathname === '/sign-in') {
      sendHtml(response, 200, renderSignInPage());
      return;
    }

    if (request.method === 'POST' && url.pathname === '/sign-in') {
      const form = await readFormBody(request);
      const email = String(form.get('email') ?? '').trim().toLowerCase();
      const member = email ? await store.findMemberByEmail(email) : null;

      if (member) {
        const magicLink = await store.createMagicLink(email, member.id, new Date(Date.now() + 15 * 60 * 1000).toISOString());
        sentEmails.push({
          id: randomUUID(),
          to: email,
          magicLinkUrl: `/auth/magic-link?token=${magicLink.token}`,
        });
      }

      sendHtml(response, 200, renderCheckEmailPage());
      return;
    }

    if (request.method === 'GET' && url.pathname === '/auth/magic-link') {
      const token = url.searchParams.get('token');
      const magicLink = token ? await store.consumeMagicLink(token, new Date().toISOString()) : null;

      if (!magicLink) {
        sendHtml(response, 200, renderMagicLinkErrorPage());
        return;
      }

      const session = await store.createSession(magicLink.memberId);
      redirect(response, '/inventory', {
        'set-cookie': `session=${session.id}; Path=/; HttpOnly; SameSite=Lax`,
      });
      return;
    }

    sendNotFound(response);
  });

  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  return {
    port: server.address().port,
    getSentEmails() {
      return [...sentEmails];
    },
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}
