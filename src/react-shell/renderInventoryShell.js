import React from 'react';
import { renderToString } from 'react-dom/server';
import { renderPage, renderPageModelScript } from '../html.js';
import { INVENTORY_SHELL_MODEL_ID, INVENTORY_SHELL_ROOT_ID, REACT_SHELL_ASSET_PATHS } from './constants.js';

function InventoryShell({ workspaceName }) {
  return React.createElement(
    'main',
    {
      className: 'min-h-screen bg-slate-950 px-4 py-6 text-slate-50',
      'data-react-shell': 'inventory',
    },
    React.createElement(
      'div',
      { className: 'mx-auto flex max-w-md flex-col gap-4' },
      React.createElement(
        'header',
        { className: 'space-y-1' },
        React.createElement('p', { className: 'text-sm font-medium uppercase tracking-[0.2em] text-slate-300' }, workspaceName),
        React.createElement('h1', { className: 'text-3xl font-semibold text-white' }, 'Inventory'),
      ),
      React.createElement(
        'section',
        { className: 'rounded-2xl bg-slate-900 p-4 shadow-sm ring-1 ring-slate-800' },
        React.createElement('h2', { className: 'text-lg font-semibold text-white' }, 'Search inventory'),
        React.createElement(
          'form',
          { method: 'get', action: '/inventory/search', className: 'mt-3 space-y-3' },
          React.createElement(
            'label',
            { className: 'block text-sm text-slate-200' },
            React.createElement('span', { className: 'mb-1 block font-medium' }, 'Search inventory'),
            React.createElement('input', {
              type: 'search',
              name: 'q',
              className: 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-white',
            }),
          ),
          React.createElement(
            'label',
            { className: 'flex items-center gap-2 text-sm text-slate-200' },
            React.createElement('input', { type: 'checkbox', name: 'includeArchived', value: '1' }),
            React.createElement('span', null, 'Include archived'),
          ),
          React.createElement('button', { type: 'submit', className: 'rounded-xl bg-sky-500 px-4 py-2 font-medium text-slate-950' }, 'Search'),
        ),
      ),
      React.createElement(
        'section',
        { className: 'rounded-2xl bg-slate-900 p-4 shadow-sm ring-1 ring-slate-800' },
        React.createElement('h2', { className: 'text-lg font-semibold text-white' }, 'Create box'),
        React.createElement(
          'form',
          { method: 'post', action: '/boxes', className: 'mt-3 space-y-3' },
          React.createElement(
            'label',
            { className: 'block text-sm text-slate-200' },
            React.createElement('span', { className: 'mb-1 block font-medium' }, 'Box name'),
            React.createElement('input', {
              type: 'text',
              name: 'name',
              maxLength: 80,
              required: true,
              className: 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-white',
            }),
          ),
          React.createElement(
            'label',
            { className: 'block text-sm text-slate-200' },
            React.createElement('span', { className: 'mb-1 block font-medium' }, 'Location'),
            React.createElement('input', {
              type: 'text',
              name: 'location',
              className: 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-white',
            }),
          ),
          React.createElement(
            'label',
            { className: 'block text-sm text-slate-200' },
            React.createElement('span', { className: 'mb-1 block font-medium' }, 'Notes'),
            React.createElement('textarea', {
              name: 'notes',
              maxLength: 1000,
              className: 'min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-white',
            }),
          ),
          React.createElement('button', { type: 'submit', className: 'rounded-xl bg-emerald-400 px-4 py-2 font-medium text-slate-950' }, 'Create box'),
        ),
      ),
      React.createElement(
        'section',
        { className: 'rounded-2xl bg-slate-900 p-4 shadow-sm ring-1 ring-slate-800' },
        React.createElement('h2', { className: 'text-lg font-semibold text-white' }, 'Invite people'),
        React.createElement(
          'form',
          { method: 'post', action: '/workspace/invites', className: 'mt-3 space-y-3' },
          React.createElement(
            'label',
            { className: 'block text-sm text-slate-200' },
            React.createElement('span', { className: 'mb-1 block font-medium' }, 'Email'),
            React.createElement('input', {
              type: 'email',
              name: 'email',
              autoComplete: 'email',
              required: true,
              className: 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-white',
            }),
          ),
          React.createElement('button', { type: 'submit', className: 'rounded-xl bg-violet-400 px-4 py-2 font-medium text-slate-950' }, 'Send invite'),
        ),
      ),
      React.createElement(
        'section',
        { className: 'rounded-2xl bg-slate-900 p-4 shadow-sm ring-1 ring-slate-800' },
        React.createElement('h2', { className: 'text-lg font-semibold text-white' }, 'Your boxes'),
        React.createElement('p', { className: 'mt-3 text-sm text-slate-300' }, 'No boxes yet.'),
      ),
    ),
  );
}

export function renderInventoryShell(workspace) {
  const pageModel = { workspaceName: workspace.name };
  const body = renderToString(React.createElement(InventoryShell, pageModel));

  return renderPage({
    title: 'Inventory',
    head: `
      <link rel="stylesheet" href="${REACT_SHELL_ASSET_PATHS.stylesheet}" />
      <script type="module" src="${REACT_SHELL_ASSET_PATHS.script}"></script>
      ${renderPageModelScript(INVENTORY_SHELL_MODEL_ID, pageModel)}
    `,
    body: `<div id="${INVENTORY_SHELL_ROOT_ID}">${body}</div>`,
  });
}

export function renderInventoryShellApp(pageModel) {
  return React.createElement(InventoryShell, pageModel);
}
