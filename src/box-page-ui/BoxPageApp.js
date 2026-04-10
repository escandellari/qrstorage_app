import React from 'react';

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

function ItemDetails({ item }) {
  const details = [
    item.quantity ? `Quantity: ${item.quantity}` : '',
    item.category ? `Category: ${item.category}` : '',
    item.notes ? `Notes: ${item.notes}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return React.createElement(
    'li',
    null,
    React.createElement('strong', null, item.name),
    details ? React.createElement('div', null, details) : null,
  );
}

function BoxEditSection({ boxCode, boxValues }) {
  const structuredFieldsHidden = boxValues.locationMode !== 'structured';

  return React.createElement(
    'section',
    null,
    React.createElement('h2', null, 'Edit box details'),
    React.createElement(
      'form',
      { method: 'post', action: `/boxes/${encodeURIComponent(boxCode)}` },
      React.createElement('input', { type: 'text', name: 'name', defaultValue: boxValues.name ?? '' }),
      React.createElement('input', { type: 'text', name: 'location', defaultValue: boxValues.location ?? '' }),
      React.createElement('button', { type: 'button', 'data-expand-structured-location': true }, 'Use structured location'),
      React.createElement(
        'div',
        structuredFieldsHidden ? { 'data-structured-location-fields': true, hidden: true } : { 'data-structured-location-fields': true },
        React.createElement('input', { type: 'text', name: 'locationSite', defaultValue: boxValues.locationSite ?? '' }),
        React.createElement('input', { type: 'text', name: 'locationRoom', defaultValue: boxValues.locationRoom ?? '' }),
        React.createElement('input', { type: 'text', name: 'locationArea', defaultValue: boxValues.locationArea ?? '' }),
        React.createElement('input', { type: 'text', name: 'locationShelf', defaultValue: boxValues.locationShelf ?? '' }),
      ),
      React.createElement('textarea', { name: 'notes', defaultValue: boxValues.notes ?? '' }),
      React.createElement('p', { 'data-notes-remaining': true }, `${1000 - String(boxValues.notes ?? '').length} characters remaining`),
      React.createElement('input', { type: 'hidden', name: 'locationMode', value: boxValues.locationMode ?? 'simple' }),
      React.createElement('input', { type: 'hidden', name: '_method', value: 'PATCH' }),
      React.createElement('button', { type: 'submit' }, 'Save box details'),
    ),
  );
}

function ItemAreaShell({ boxCode, boxValues, items = [], emptyPrompt = '', itemLimitMessage = '', archived = false }) {
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
          : React.createElement('ul', null, items.map((item) => React.createElement(ItemDetails, { key: item.id, item }))),
    ),
    archived
      ? null
      : React.createElement(
          React.Fragment,
          null,
          React.createElement(BoxEditSection, { boxCode, boxValues }),
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
      React.createElement('h1', null, "We couldn't find that box"),
      React.createElement('p', null, 'Check the code and try again.'),
      React.createElement('p', null, React.createElement('a', { href: '/inventory' }, 'Back to inventory')),
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
      archived: pageModel.state === 'archived',
    }),
  );
}

export function renderBoxPageApp(pageModel) {
  return React.createElement(BoxPage, { pageModel });
}
