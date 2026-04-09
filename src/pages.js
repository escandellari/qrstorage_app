import { renderBoxItemsSection } from './box-page-view.js';
import { MAX_BOX_NAME_LENGTH, MAX_BOX_NOTES_LENGTH, getBoxEditValues } from './box-details.js';

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

export function renderSignInPage({ returnTo = '', message = 'Enter your email to continue.' } = {}) {
  return renderPage({
    title: 'Sign in',
    body: `
      <main>
        <h1>Sign in</h1>
        <p>${escapeHtml(message)}</p>
        <form method="post" action="/sign-in">
          <input type="hidden" name="returnTo" value="${escapeHtml(returnTo)}" />
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

function renderBoxEditSection(box, boxValues = {}, boxErrors = {}, boxOriginalValues = {}) {
  const values = getBoxEditValues(box, boxValues);
  const originalValues = getBoxEditValues(box, boxOriginalValues);
  const structuredLocationAttributes = values.locationMode === 'structured' ? 'data-structured-location-fields' : 'data-structured-location-fields hidden';

  return `<section>
          <h2>Edit box details</h2>
          <form method="post" action="/boxes/${encodeURIComponent(box.boxCode)}">
            <label>
              Box name
              <input type="text" name="name" maxlength="80" value="${escapeHtml(values.name)}" required />
            </label>
            ${boxErrors.name ? `<p>${escapeHtml(boxErrors.name)}</p>` : ''}
            <label>
              Location
              <input type="text" name="location" value="${escapeHtml(values.location)}" />
            </label>
            <button type="button" data-expand-structured-location>Use structured location</button>
            <div ${structuredLocationAttributes}>
              <label>
                Site or building
                <input type="text" name="locationSite" value="${escapeHtml(values.locationSite)}" />
              </label>
              <label>
                Room
                <input type="text" name="locationRoom" value="${escapeHtml(values.locationRoom)}" />
              </label>
              <label>
                Storage area
                <input type="text" name="locationArea" value="${escapeHtml(values.locationArea)}" />
              </label>
              <label>
                Shelf or position
                <input type="text" name="locationShelf" value="${escapeHtml(values.locationShelf)}" />
              </label>
            </div>
            <label>
              Notes
              <textarea name="notes" maxlength="1000">${escapeHtml(values.notes)}</textarea>
            </label>
            ${boxErrors.notes ? `<p>${escapeHtml(boxErrors.notes)}</p>` : ''}
            <p data-notes-remaining>${1000 - values.notes.length} characters remaining</p>
            <input type="hidden" name="locationMode" value="${escapeHtml(values.locationMode)}" />
            <input type="hidden" name="originalBoxName" value="${escapeHtml(originalValues.name)}" />
            <input type="hidden" name="originalBoxLocation" value="${escapeHtml(originalValues.location)}" />
            <input type="hidden" name="originalBoxNotes" value="${escapeHtml(originalValues.notes)}" />
            <input type="hidden" name="originalBoxLocationMode" value="${escapeHtml(originalValues.locationMode)}" />
            <input type="hidden" name="originalBoxLocationSite" value="${escapeHtml(originalValues.locationSite)}" />
            <input type="hidden" name="originalBoxLocationRoom" value="${escapeHtml(originalValues.locationRoom)}" />
            <input type="hidden" name="originalBoxLocationArea" value="${escapeHtml(originalValues.locationArea)}" />
            <input type="hidden" name="originalBoxLocationShelf" value="${escapeHtml(originalValues.locationShelf)}" />
            <input type="hidden" name="_method" value="PATCH" />
            <button type="submit">Save box details</button>
          </form>
        </section>`;
}

export function renderBoxPage(
  box,
  {
    labelPath = `/boxes/${encodeURIComponent(box.boxCode)}/label`,
    items = [],
    itemValues = {},
    itemErrors = {},
    itemLimitMessage = '',
    editItemId = '',
    editItemValues = {},
    editItemErrors = {},
    editOriginalItemValues = {},
    conflictItemId = '',
    conflictItem = null,
    removedItemMessage = '',
    boxValues = {},
    boxErrors = {},
    boxWarning = '',
    boxOriginalValues = {},
    conflictBox = null,
  } = {},
) {
  const name = escapeHtml(itemValues.name ?? '');
  const quantity = escapeHtml(itemValues.quantity ?? '');
  const category = escapeHtml(itemValues.category ?? '');
  const notes = escapeHtml(itemValues.notes ?? '');
  const itemList = renderBoxItemsSection({
    boxCode: box.boxCode,
    items,
    editItemId,
    editItemValues,
    editItemErrors,
    editOriginalItemValues,
    conflictItemId,
    conflictItem,
    escapeHtml,
  });
  const boxEditSection = renderBoxEditSection(box, boxValues, boxErrors, boxOriginalValues);

  return renderPage({
    title: box.name,
    head: `
      <script>
        document.addEventListener('input', (event) => {
          const notesField = event.target.closest('textarea[name="notes"]');
          const counter = notesField?.form?.querySelector('[data-notes-remaining]');

          if (!notesField || !counter) {
            return;
          }

          counter.textContent = String(1000 - notesField.value.length) + ' characters remaining';
        });
      </script>
    `,
    body: `
      <main>
        <p><a href="/inventory">Inventory</a></p>
        <p><a href="${escapeHtml(labelPath)}">Print label</a></p>
        <h1>${escapeHtml(box.name)}</h1>
        <p><strong>Box code</strong>: ${escapeHtml(box.boxCode)}</p>
        ${box.locationSummary ? `<p><strong>Location</strong>: ${escapeHtml(box.locationSummary)}</p>` : ''}
        ${box.notes ? `<p><strong>Notes</strong>: ${escapeHtml(box.notes)}</p>` : ''}
        ${removedItemMessage ? `<p>${escapeHtml(removedItemMessage)}</p>` : ''}
        ${boxWarning ? `<p>${escapeHtml(boxWarning)}</p>` : ''}
        ${conflictBox ? `<div><p>This box was updated by someone else.</p><p>Latest saved box: ${escapeHtml(conflictBox.name)}${conflictBox.locationSummary ? ` · Location: ${escapeHtml(conflictBox.locationSummary)}` : ''}${conflictBox.notes ? ` · Notes: ${escapeHtml(conflictBox.notes)}` : ''}</p></div>` : ''}
        ${boxEditSection}
        ${itemList}
        <section>
          <h2>Add item</h2>
          ${itemLimitMessage ? `<p>${escapeHtml(itemLimitMessage)}</p>` : ''}
          ${itemLimitMessage ? '' : `<form method="post" action="/boxes/${encodeURIComponent(box.boxCode)}/items">
            <label>
              Item name
              <input type="text" name="name" value="${name}" required />
            </label>
            ${itemErrors.name ? `<p>${escapeHtml(itemErrors.name)}</p>` : ''}
            <label>
              Quantity
              <input type="text" name="quantity" inputmode="numeric" value="${quantity}" />
            </label>
            ${itemErrors.quantity ? `<p>${escapeHtml(itemErrors.quantity)}</p>` : ''}
            <label>
              Category
              <input type="text" name="category" value="${category}" />
            </label>
            ${itemErrors.category ? `<p>${escapeHtml(itemErrors.category)}</p>` : ''}
            <label>
              Notes
              <textarea name="notes">${notes}</textarea>
            </label>
            ${itemErrors.notes ? `<p>${escapeHtml(itemErrors.notes)}</p>` : ''}
            <button type="submit">Add item</button>
          </form>`}
        </section>
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

export function renderBoxNotFoundPage() {
  return renderPage({
    title: 'Box not found',
    body: `
      <main>
        <h1>We couldn't find that box</h1>
        <p>Check the code and try again.</p>
        <p><a href="/inventory">Back to inventory</a></p>
      </main>
    `,
  });
}

export function validateBoxInput({ name, notes }) {
  const errors = {};

  if (!name) {
    errors.name = 'Enter a box name.';
  } else if (name.length > MAX_BOX_NAME_LENGTH) {
    errors.name = `Box name must be ${MAX_BOX_NAME_LENGTH} characters or fewer.`;
  }

  if (notes.length > MAX_BOX_NOTES_LENGTH) {
    errors.notes = `Notes must be ${MAX_BOX_NOTES_LENGTH} characters or fewer.`;
  }

  return errors;
}
