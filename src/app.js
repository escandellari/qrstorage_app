import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createDataStore } from './data-store.js';

function renderPage({ title, body }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body>
    ${body}
  </body>
</html>`;
}

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

function renderSignInPage() {
  return renderPage({
    title: 'Sign in',
    body: `
      <main>
        <h1>Sign in</h1>
        <p>Enter your email to continue.</p>
        <form method="post" action="/sign-in">
          <label>
            Email
            <input type="email" name="email" autocomplete="email" required />
          </label>
          <button type="submit">Send magic link</button>
        </form>
      </main>
    `,
  });
}

function renderCheckEmailPage() {
  return renderPage({
    title: 'Check your email',
    body: `
      <main>
        <h1>Check your email</h1>
        <p>If that email can access this workspace, we have sent a magic link.</p>
      </main>
    `,
  });
}

function renderInventoryPage(workspace) {
  return renderPage({
    title: 'Inventory',
    body: `
      <main>
        <h1>Inventory</h1>
        <p>${workspace.name}</p>
        <section>
          <h2>Your boxes</h2>
          <p>No boxes yet.</p>
        </section>
      </main>
    `,
  });
}

function renderMagicLinkErrorPage() {
  return renderPage({
    title: 'Magic link error',
    body: `
      <main>
        <h1>This link has expired</h1>
        <p>Request a new magic link to continue.</p>
        <p><a href="/sign-in">Request a new magic link</a></p>
      </main>
    `,
  });
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

export async function startServer({ dataDir, port = 0, seedData } = {}) {
  const store = await createDataStore(dataDir, seedData);
  const sentEmails = [];

  const server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');

    if (request.method === 'GET' && url.pathname === '/inventory') {
      const cookies = parseCookies(request);
      const session = cookies.session ? await store.findSession(cookies.session) : null;
      const member = session ? await store.findMemberById(session.memberId) : null;
      const workspace = member ? await store.findWorkspaceById(member.workspaceId) : null;

      if (!workspace) {
        redirect(response, '/sign-in');
        return;
      }

      sendHtml(response, 200, renderInventoryPage(workspace));
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
      const magicLink = token ? await store.findMagicLink(token) : null;

      if (!magicLink || magicLink.consumedAt || new Date(magicLink.expiresAt).getTime() <= Date.now()) {
        sendHtml(response, 200, renderMagicLinkErrorPage());
        return;
      }

      await store.consumeMagicLink(token, new Date().toISOString());
      const session = await store.createSession(magicLink.memberId);
      redirect(response, '/inventory', {
        'set-cookie': `session=${session.id}; Path=/; HttpOnly; SameSite=Lax`,
      });
      return;
    }

    response.writeHead(404);
    response.end('Not found');
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
