import { renderBoxConflictMessage, renderBoxEditSection, renderBoxNotesCounterScript } from './box-edit-view.js';
import { renderBoxActions, renderBoxItemsSection } from './box-page-view.js';
import { MAX_BOX_NAME_LENGTH, MAX_BOX_NOTES_LENGTH } from './box-details.js';
import { escapeHtml, renderPage } from './html.js';
import { renderInventorySearchForm } from './inventory-search-form.js';

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

export function renderInventoryPage(workspace, values = {}, errors = {}, options = {}) {
  const name = escapeHtml(values.name ?? '');
  const location = escapeHtml(values.location ?? '');
  const notes = escapeHtml(values.notes ?? '');
  const inviteEmail = escapeHtml(options.inviteValues?.email ?? '');

  return renderPage({
    title: 'Inventory',
    body: `
      <main>
        <h1>Inventory</h1>
        <p>${escapeHtml(workspace.name)}</p>
        <section>
          <h2>Search inventory</h2>
          ${renderInventorySearchForm()}
        </section>
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
          <h2>Invite people</h2>
          ${options.inviteMessage ? `<p>${escapeHtml(options.inviteMessage)}</p>` : ''}
          ${options.inviteError ? `<p>${escapeHtml(options.inviteError)}</p>` : ''}
          <form method="post" action="/workspace/invites">
            <label>
              Email
              <input type="email" name="email" autocomplete="email" value="${inviteEmail}" required />
            </label>
            <button type="submit">Send invite</button>
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
  const boxActions = renderBoxActions({
    escapeHtml,
    labelPath,
    duplicatePath: `/boxes/${encodeURIComponent(box.boxCode)}/duplicate`,
  });
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
  const boxEditSection = renderBoxEditSection({ box, boxValues, boxErrors, boxOriginalValues, escapeHtml });

  return renderPage({
    title: box.name,
    head: renderBoxNotesCounterScript(),
    body: `
      <main>
        ${boxActions}
        <h1>${escapeHtml(box.name)}</h1>
        <p><strong>Box code</strong>: ${escapeHtml(box.boxCode)}</p>
        ${box.locationSummary ? `<p><strong>Location</strong>: ${escapeHtml(box.locationSummary)}</p>` : ''}
        ${box.notes ? `<p><strong>Notes</strong>: ${escapeHtml(box.notes)}</p>` : ''}
        ${removedItemMessage ? `<p>${escapeHtml(removedItemMessage)}</p>` : ''}
        ${boxWarning ? `<p>${escapeHtml(boxWarning)}</p>` : ''}
        ${renderBoxConflictMessage(conflictBox, escapeHtml)}
        <form method="post" action="/boxes/${encodeURIComponent(box.boxCode)}/archive">
          <button type="submit">Archive box</button>
        </form>
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

export function renderInviteErrorPage() {
  return renderPage({
    title: 'Invite link error',
    body: `
      <main>
        <h1>This invite link has expired</h1>
        <p>Request a new invite to continue.</p>
        <p><a href="/sign-in">Request a new invite</a></p>
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
