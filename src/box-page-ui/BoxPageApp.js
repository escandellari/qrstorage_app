import React from 'react';
import { renderBoxEditorState } from '../box-editor-ui/renderBoxEditorState.js';
import { renderBoxItemsState } from '../box-items-ui/renderBoxItemsState.js';

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
  itemValues = {},
  itemErrors = {},
  editItemId = '',
  editItemValues = {},
  editItemErrors = {},
  editOriginalItemValues = {},
  conflictItemId = '',
  conflictItem = null,
  removedItemMessage = '',
  archived = false,
}) {
  const itemStateProps = {
    boxCode,
    items,
    emptyPrompt,
    itemLimitMessage,
    itemValues,
    itemErrors,
    editItemId,
    editItemValues,
    editItemErrors,
    editOriginalItemValues,
    conflictItemId,
    conflictItem,
    removedItemMessage,
    archived,
  };

  return React.createElement(
    React.Fragment,
    null,
    renderBoxItemsState({ ...itemStateProps, section: 'contents' }),
    archived ? null : renderBoxEditorState({ boxCode, boxValues, boxOriginalValues, boxErrors, boxWarning, conflictBox }),
    renderBoxItemsState({ ...itemStateProps, section: 'add-form' }),
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
      itemValues: pageModel.itemValues,
      itemErrors: pageModel.itemErrors,
      editItemId: pageModel.editItemId,
      editItemValues: pageModel.editItemValues,
      editItemErrors: pageModel.editItemErrors,
      editOriginalItemValues: pageModel.editOriginalItemValues,
      conflictItemId: pageModel.conflictItemId,
      conflictItem: pageModel.conflictItem,
      removedItemMessage: pageModel.removedItemMessage,
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
