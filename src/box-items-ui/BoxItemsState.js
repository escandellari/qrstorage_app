import React from 'react';

function FieldLabel({ text, input }) {
  return React.createElement('label', null, text, input);
}

function ItemConflictMessage({ conflictItem }) {
  if (!conflictItem) {
    return null;
  }

  const latestSavedItem = [
    conflictItem.name,
    conflictItem.quantity ? `Quantity: ${conflictItem.quantity}` : '',
    conflictItem.category ? `Category: ${conflictItem.category}` : '',
    conflictItem.notes ? `Notes: ${conflictItem.notes}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return React.createElement(
    'div',
    null,
    React.createElement('p', null, 'This item was updated by someone else.'),
    React.createElement('p', null, `Latest saved item: ${latestSavedItem}`),
  );
}

function ItemFormFields({ values = {}, errors = {}, submitLabel, originalValues = null, labelPrefix = 'Item' }) {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(FieldLabel, {
      text: `${labelPrefix} name`,
      input: React.createElement('input', { type: 'text', name: 'name', defaultValue: values.name ?? '', required: true }),
    }),
    errors.name ? React.createElement('p', null, errors.name) : null,
    React.createElement(FieldLabel, {
      text: `${labelPrefix} quantity`,
      input: React.createElement('input', { type: 'text', name: 'quantity', inputMode: 'numeric', defaultValue: values.quantity ?? '' }),
    }),
    errors.quantity ? React.createElement('p', null, errors.quantity) : null,
    React.createElement(FieldLabel, {
      text: `${labelPrefix} category`,
      input: React.createElement('input', { type: 'text', name: 'category', defaultValue: values.category ?? '' }),
    }),
    errors.category ? React.createElement('p', null, errors.category) : null,
    React.createElement(FieldLabel, {
      text: `${labelPrefix} notes`,
      input: React.createElement('textarea', { name: 'notes', defaultValue: values.notes ?? '' }),
    }),
    errors.notes ? React.createElement('p', null, errors.notes) : null,
    originalValues
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement('input', { type: 'hidden', name: '_method', value: 'PATCH' }),
          React.createElement('input', { type: 'hidden', name: 'originalName', value: originalValues.name ?? '' }),
          React.createElement('input', { type: 'hidden', name: 'originalQuantity', value: originalValues.quantity ?? '' }),
          React.createElement('input', { type: 'hidden', name: 'originalCategory', value: originalValues.category ?? '' }),
          React.createElement('input', { type: 'hidden', name: 'originalNotes', value: originalValues.notes ?? '' }),
        )
      : null,
    React.createElement('button', { type: 'submit', formMethod: 'post' }, submitLabel),
  );
}

function ItemDetails({ boxCode, item, editItemId, editItemValues, editItemErrors, editOriginalItemValues, conflictItemId, conflictItem }) {
  const details = [
    item.quantity ? `Quantity: ${item.quantity}` : '',
    item.category ? `Category: ${item.category}` : '',
    item.notes ? `Notes: ${item.notes}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const itemValues =
    item.id === editItemId
      ? editItemValues
      : {
          name: item.name ?? '',
          quantity: item.quantity ? String(item.quantity) : '',
          category: item.category ?? '',
          notes: item.notes ?? '',
        };
  const itemErrors = item.id === editItemId ? editItemErrors : {};
  const originalValues =
    item.id === editItemId
      ? editOriginalItemValues
      : {
          name: item.name ?? '',
          quantity: item.quantity ? String(item.quantity) : '',
          category: item.category ?? '',
          notes: item.notes ?? '',
        };

  return React.createElement(
    'li',
    null,
    React.createElement('strong', null, item.name),
    details ? React.createElement('div', null, details) : null,
    item.id === conflictItemId ? React.createElement(ItemConflictMessage, { conflictItem }) : null,
    React.createElement(
      'form',
      { method: 'post', action: `/boxes/${encodeURIComponent(boxCode)}/items/${encodeURIComponent(item.id)}` },
      React.createElement(ItemFormFields, {
        values: itemValues,
        errors: itemErrors,
        originalValues,
        submitLabel: 'Save changes',
        labelPrefix: 'Item',
      }),
    ),
    React.createElement(
      'form',
      { method: 'post', action: `/boxes/${encodeURIComponent(boxCode)}/items/${encodeURIComponent(item.id)}/delete` },
      React.createElement('button', { type: 'submit' }, 'Delete item'),
    ),
  );
}

export function BoxItemsState({
  boxCode,
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
  section = 'all',
}) {
  const contentsSection = React.createElement(
    'section',
    null,
    React.createElement('h2', null, 'Contents'),
    removedItemMessage ? React.createElement('p', null, removedItemMessage) : null,
    archived
      ? React.createElement('p', null, 'This box is archived. Restore it to edit its contents.')
      : items.length === 0
        ? React.createElement('p', null, emptyPrompt)
        : React.createElement(
            'ul',
            null,
            items.map((item) =>
              React.createElement(ItemDetails, {
                key: item.id,
                boxCode,
                item,
                editItemId,
                editItemValues,
                editItemErrors,
                editOriginalItemValues,
                conflictItemId,
                conflictItem,
              }),
            ),
          ),
  );

  const addFormSection = archived
    ? null
    : React.createElement(
        'section',
        null,
        React.createElement('h2', null, 'Add item'),
        itemLimitMessage ? React.createElement('p', null, itemLimitMessage) : null,
        itemLimitMessage
          ? null
          : React.createElement(
              'form',
              { method: 'post', action: `/boxes/${encodeURIComponent(boxCode)}/items` },
              React.createElement(ItemFormFields, {
                values: itemValues,
                errors: itemErrors,
                submitLabel: 'Add item',
                labelPrefix: 'Item',
              }),
            ),
      );

  if (section === 'contents') {
    return contentsSection;
  }

  if (section === 'add-form') {
    return addFormSection;
  }

  return React.createElement(React.Fragment, null, contentsSection, addFormSection);
}
