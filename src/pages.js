function renderPage({ title, head = '', body }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    ${head}
  </head>
  <body>
    ${body}
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderSignInPage() {
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

export function renderCheckEmailPage() {
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

export function renderInventoryPage(workspace, values = {}, errors = {}) {
  const name = escapeHtml(values.name ?? '');
  const location = escapeHtml(values.location ?? '');
  const notes = escapeHtml(values.notes ?? '');

  return renderPage({
    title: 'Inventory',
    body: `
      <main>
        <h1>Inventory</h1>
        <p>${escapeHtml(workspace.name)}</p>
        <section>
          <h2>Create box</h2>
          <form method="post" action="/boxes">
            <label>
              Box name
              <input type="text" name="name" maxlength="80" value="${name}" required />
            </label>
            ${errors.name ? `<p>${escapeHtml(errors.name)}</p>` : ''}
            <label>
              Location
              <input type="text" name="location" value="${location}" />
            </label>
            <label>
              Notes
              <textarea name="notes" maxlength="1000">${notes}</textarea>
            </label>
            ${errors.notes ? `<p>${escapeHtml(errors.notes)}</p>` : ''}
            <button type="submit">Create box</button>
          </form>
        </section>
        <section>
          <h2>Your boxes</h2>
          <p>No boxes yet.</p>
        </section>
      </main>
    `,
  });
}

export function renderBoxPage(box, { labelPath = `/boxes/${encodeURIComponent(box.boxCode)}/label` } = {}) {
  return renderPage({
    title: box.name,
    body: `
      <main>
        <p><a href="/inventory">Inventory</a></p>
        <p><a href="${escapeHtml(labelPath)}">Print label</a></p>
        <h1>${escapeHtml(box.name)}</h1>
        <p><strong>Box code</strong>: ${escapeHtml(box.boxCode)}</p>
        ${box.locationSummary ? `<p><strong>Location</strong>: ${escapeHtml(box.locationSummary)}</p>` : ''}
        ${box.notes ? `<p><strong>Notes</strong>: ${escapeHtml(box.notes)}</p>` : ''}
      </main>
    `,
  });
}

export function renderLabelPage(box, { qrSvg, qrTarget }) {
  const name = box.name ? `<p><strong>Name</strong>: ${escapeHtml(box.name)}</p>` : '';
  const location = box.locationSummary ? `<p><strong>Location</strong>: ${escapeHtml(box.locationSummary)}</p>` : '';

  return renderPage({
    title: `Print label ${box.boxCode}`,
    head: `
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
        }

        main {
          padding: 16px;
        }

        section {
          width: 320px;
        }

        svg {
          display: block;
          width: 100%;
          height: auto;
        }

        p {
          margin: 8px 0 0;
          overflow-wrap: anywhere;
        }

        @media print {
          body {
            margin: 0;
          }

          main {
            padding: 0;
          }
        }
      </style>
    `,
    body: `
      <main>
        <section>
          <div data-qr-target="${escapeHtml(qrTarget)}">${qrSvg}</div>
          <p><strong>Box code</strong>: ${escapeHtml(box.boxCode)}</p>
          ${name}
          ${location}
        </section>
      </main>
    `,
  });
}

export function renderMagicLinkErrorPage() {
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

export function validateBoxInput({ name, notes }) {
  const errors = {};

  if (!name) {
    errors.name = 'Enter a box name.';
  } else if (name.length > 80) {
    errors.name = 'Box name must be 80 characters or fewer.';
  }

  if (notes.length > 1000) {
    errors.notes = 'Notes must be 1000 characters or fewer.';
  }

  return errors;
}
