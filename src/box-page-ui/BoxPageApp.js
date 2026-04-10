import React from 'react';
import { renderBoxEditorState } from '../box-editor-ui/renderBoxEditorState.js';

function DetailRow({ label, value }) {
  return React.createElement(
    'p',
    null,
    React.createElement('strong', null, label),
    `: ${value}`,
  );
}

function BoxActions({ boxCode, labelPath, showArchiveAction }) {
  return React.createElement(
    'nav',
    null,
    React.createElement('p', null, React.createElement('a', { href: '/inventory' }, 'Inventory')),
    React.createElement('p', null, React.createElement('a', { href: '/inventory/search' }, 'Search inventory')),
    React.createElement('p', null, React.createElement('a', { href: labelPath }, 'Print label')),
    showArchiveAction
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement(
            'form',
            { method: 'post', action: `/boxes/${encodeURIComponent(boxCode)}/duplicate` },
            React.createElement('button', { type: 'submit' }, 'Duplicate box'),
          ),
          React.createElement(
            'form',
            { method: 'post', action: `/boxes/${encodeURIComponent(boxCode)}/archive` },
            React.createElement('button', { type: 'submit' }, 'Archive box'),
          ),
        )
      : null,
  );
}

function ItemDetails({ boxCode, item }) {
  const details = [
    item.quantity ? `Quantity: ${item.quantity}` : '',
    item.category ? `Category: ${item.category}` : '',
    item.notes ? `Notes: ${item.notes}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const quantityValue = item.quantity ? String(item.quantity) : '';

  return React.createElement(
    'li',
    null,
    React.createElement('strong', null, item.name),
    details ? React.createElement('div', null, details) : null,
    React.createElement(
      'form',
      { method: 'post', action: `/boxes/${encodeURIComponent(boxCode)}/items/${encodeURIComponent(item.id)}` },
      React.createElement('input', { type: 'text', name: 'name', defaultValue: item.name ?? '' }),
      React.createElement('input', { type: 'text', name: 'quantity', inputMode: 'numeric', defaultValue: quantityValue }),
      React.createElement('input', { type: 'text', name: 'category', defaultValue: item.category ?? '' }),
      React.createElement('textarea', { name: 'notes', defaultValue: item.notes ?? '' }),
      React.createElement('input', { type: 'hidden', name: '_method', value: 'PATCH' }),
      React.createElement('input', { type: 'hidden', name: 'originalName', value: item.name ?? '' }),
      React.createElement('input', { type: 'hidden', name: 'originalQuantity', value: quantityValue }),
      React.createElement('input', { type: 'hidden', name: 'originalCategory', value: item.category ?? '' }),
      React.createElement('input', { type: 'hidden', name: 'originalNotes', value: item.notes ?? '' }),
      React.createElement('button', { type: 'submit', formMethod: 'post' }, 'Save changes'),
    ),
    React.createElement(
      'form',
      { method: 'post', action: `/boxes/${encodeURIComponent(boxCode)}/items/${encodeURIComponent(item.id)}/delete` },
      React.createElement('button', { type: 'submit' }, 'Delete item'),
    ),
  );
}


function ItemAreaShell({
  boxCode,
  boxValues,
  boxOriginalValues,
  boxErrors,
  boxWarning,
  conflictBox,
  items = [],
  emptyPrompt = '',
  itemLimitMessage = '',
  archived = false,
}) {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'section',
      null,
      React.createElement('h2', null, 'Contents'),
      archived
        ? React.createElement('p', null, 'This box is archived. Restore it to edit its contents.')
        : items.length === 0
          ? React.createElement('p', null, emptyPrompt)
          : React.createElement('ul', null, items.map((item) => React.createElement(ItemDetails, { key: item.id, boxCode, item }))),
    ),
    archived
      ? null
      : React.createElement(
          React.Fragment,
          null,
          renderBoxEditorState({ boxCode, boxValues, boxOriginalValues, boxErrors, boxWarning, conflictBox }),
          React.createElement(
            'section',
            null,
            React.createElement('h2', null, 'Add item'),
            itemLimitMessage
              ? React.createElement('p', null, itemLimitMessage)
              : React.createElement(
                  'form',
                  { method: 'post', action: `/boxes/${encodeURIComponent(boxCode)}/items` },
                  React.createElement('input', { type: 'text', name: 'name' }),
                  React.createElement('input', { type: 'text', name: 'quantity' }),
                  React.createElement('input', { type: 'text', name: 'category' }),
                  React.createElement('textarea', { name: 'notes' }),
                  React.createElement('button', { type: 'submit' }, 'Add item'),
                ),
          ),
        ),
  );
}

function BoxPage({ pageModel }) {
  if (pageModel.state === 'missing') {
    return React.createElement(
      'main',
      { 'data-react-screen': 'box-page' },
      React.createElement('h1', null, pageModel.heading),
      React.createElement('p', null, pageModel.message),
      React.createElement('p', null, React.createElement('a', { href: '/inventory' }, pageModel.linkText)),
    );
  }

  return React.createElement(
    'main',
    { 'data-react-screen': 'box-page' },
    React.createElement(BoxActions, {
      boxCode: pageModel.boxCode,
      labelPath: pageModel.labelPath,
      showArchiveAction: pageModel.state === 'active',
    }),
    pageModel.state === 'archived' ? React.createElement('p', null, 'Archived') : null,
    React.createElement('h1', null, pageModel.name),
    React.createElement(DetailRow, { label: 'Box code', value: pageModel.boxCode }),
    pageModel.locationSummary ? React.createElement(DetailRow, { label: 'Location', value: pageModel.locationSummary }) : null,
    pageModel.notes ? React.createElement(DetailRow, { label: 'Notes', value: pageModel.notes }) : null,
    pageModel.state === 'archived'
      ? React.createElement(
          'form',
          { method: 'post', action: `/boxes/${encodeURIComponent(pageModel.boxCode)}/restore` },
          React.createElement('button', { type: 'submit' }, 'Restore box'),
        )
      : null,
    React.createElement(ItemAreaShell, {
      boxCode: pageModel.boxCode,
      boxValues: pageModel.boxValues,
      items: pageModel.items,
      emptyPrompt: pageModel.emptyPrompt,
      itemLimitMessage: pageModel.itemLimitMessage,
      boxOriginalValues: pageModel.boxOriginalValues,
      boxErrors: pageModel.boxErrors,
      boxWarning: pageModel.boxWarning,
      conflictBox: pageModel.conflictBox,
      archived: pageModel.state === 'archived',
    }),
  );
}

export function renderBoxPageApp(pageModel) {
  return React.createElement(BoxPage, { pageModel });
}
