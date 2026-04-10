import React from 'react';
import { MAX_BOX_NAME_LENGTH, MAX_BOX_NOTES_LENGTH } from '../box-details.js';

function FieldLabel({ text, input }) {
  return React.createElement('label', null, text, input);
}

function BoxConflictMessage({ conflictBox }) {
  if (!conflictBox) {
    return null;
  }

  const latestSavedBox = [
    conflictBox.name,
    conflictBox.locationSummary ? `Location: ${conflictBox.locationSummary}` : '',
    conflictBox.notes ? `Notes: ${conflictBox.notes}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return React.createElement(
    'div',
    null,
    React.createElement('p', null, 'This box was updated by someone else.'),
    React.createElement('p', null, `Latest saved box: ${latestSavedBox}`),
  );
}

export function BoxEditorState({ boxCode, boxValues, boxOriginalValues, boxErrors = {}, boxWarning = '', conflictBox = null }) {
  const structuredFieldsHidden = boxValues.locationMode !== 'structured';

  return React.createElement(
    'section',
    null,
    React.createElement('h2', null, 'Edit box details'),
    boxWarning ? React.createElement('p', null, boxWarning) : null,
    React.createElement(BoxConflictMessage, { conflictBox }),
    React.createElement(
      'form',
      { method: 'post', action: `/boxes/${encodeURIComponent(boxCode)}` },
      React.createElement(FieldLabel, {
        text: 'Box name',
        input: React.createElement('input', { type: 'text', name: 'name', defaultValue: boxValues.name ?? '', required: true, maxLength: MAX_BOX_NAME_LENGTH }),
      }),
      boxErrors.name ? React.createElement('p', null, boxErrors.name) : null,
      React.createElement(FieldLabel, {
        text: 'Location',
        input: React.createElement('input', { type: 'text', name: 'location', defaultValue: boxValues.location ?? '' }),
      }),
      React.createElement('button', { type: 'button', 'data-expand-structured-location': true }, 'Use structured location'),
      React.createElement(
        'div',
        structuredFieldsHidden ? { 'data-structured-location-fields': true, hidden: true } : { 'data-structured-location-fields': true },
        React.createElement(FieldLabel, {
          text: 'Site or building',
          input: React.createElement('input', { type: 'text', name: 'locationSite', defaultValue: boxValues.locationSite ?? '' }),
        }),
        React.createElement(FieldLabel, {
          text: 'Room',
          input: React.createElement('input', { type: 'text', name: 'locationRoom', defaultValue: boxValues.locationRoom ?? '' }),
        }),
        React.createElement(FieldLabel, {
          text: 'Storage area',
          input: React.createElement('input', { type: 'text', name: 'locationArea', defaultValue: boxValues.locationArea ?? '' }),
        }),
        React.createElement(FieldLabel, {
          text: 'Shelf or position',
          input: React.createElement('input', { type: 'text', name: 'locationShelf', defaultValue: boxValues.locationShelf ?? '' }),
        }),
      ),
      React.createElement(FieldLabel, {
        text: 'Notes',
        input: React.createElement('textarea', { name: 'notes', defaultValue: boxValues.notes ?? '', maxLength: MAX_BOX_NOTES_LENGTH }),
      }),
      boxErrors.notes ? React.createElement('p', null, boxErrors.notes) : null,
      React.createElement('p', { 'data-notes-remaining': true }, `${MAX_BOX_NOTES_LENGTH - String(boxValues.notes ?? '').length} characters remaining`),
      React.createElement('input', { type: 'hidden', name: 'locationMode', value: boxValues.locationMode ?? 'simple' }),
      React.createElement('input', { type: 'hidden', name: 'originalBoxName', value: boxOriginalValues.name ?? '' }),
      React.createElement('input', { type: 'hidden', name: 'originalBoxLocation', value: boxOriginalValues.location ?? '' }),
      React.createElement('input', { type: 'hidden', name: 'originalBoxNotes', value: boxOriginalValues.notes ?? '' }),
      React.createElement('input', { type: 'hidden', name: 'originalBoxLocationMode', value: boxOriginalValues.locationMode ?? 'simple' }),
      React.createElement('input', { type: 'hidden', name: 'originalBoxLocationSite', value: boxOriginalValues.locationSite ?? '' }),
      React.createElement('input', { type: 'hidden', name: 'originalBoxLocationRoom', value: boxOriginalValues.locationRoom ?? '' }),
      React.createElement('input', { type: 'hidden', name: 'originalBoxLocationArea', value: boxOriginalValues.locationArea ?? '' }),
      React.createElement('input', { type: 'hidden', name: 'originalBoxLocationShelf', value: boxOriginalValues.locationShelf ?? '' }),
      React.createElement('input', { type: 'hidden', name: '_method', value: 'PATCH' }),
      React.createElement('button', { type: 'submit' }, 'Save box details'),
    ),
  );
}
