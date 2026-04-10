import React from 'react';

function PrimaryAction({ pageModel }) {
  if (pageModel.mode === 'switch') {
    return React.createElement(
      'form',
      { method: 'post', action: '/workspace/switch', className: 'mt-6' },
      React.createElement('input', { type: 'hidden', name: 'workspaceId', value: pageModel.targetWorkspaceId }),
      React.createElement(
        'button',
        { type: 'submit', className: 'w-full rounded-xl bg-sky-500 px-4 py-2 font-medium text-slate-950' },
        'Switch workspace',
      ),
    );
  }

  return React.createElement(
    'p',
    { className: 'mt-6' },
    React.createElement('a', { href: '/workspace/request-invite', className: 'font-medium text-sky-300 underline' }, 'Request an invite'),
  );
}

function RecoveryActions({ backHref }) {
  return React.createElement(
    'p',
    { className: 'mt-6' },
    React.createElement('a', { href: backHref, className: 'font-medium text-sky-300 underline' }, 'Back to inventory'),
  );
}

function AccessRecoveryApp({ pageModel }) {
  const message =
    pageModel.mode === 'switch'
      ? 'Switch workspace to continue.'
      : pageModel.mode === 'request-invite-page'
        ? 'Ask a member of the correct workspace to send you an invite.'
        : 'Request an invite to continue.';

  return React.createElement(
    'main',
    {
      className: 'min-h-screen bg-slate-950 px-4 py-6 text-slate-50',
      'data-react-screen': 'box-access-recovery',
    },
    React.createElement(
      'div',
      { className: 'mx-auto flex max-w-md flex-col gap-4' },
      React.createElement(
        'section',
        { className: 'rounded-3xl bg-slate-900 p-6 shadow-sm ring-1 ring-slate-800' },
        React.createElement('h1', { className: 'text-3xl font-semibold text-white' }, pageModel.heading),
        React.createElement('p', { className: 'mt-3 text-sm font-medium uppercase tracking-[0.2em] text-slate-300' }, pageModel.currentWorkspaceName),
        React.createElement('p', { className: 'mt-3 text-sm text-slate-300' }, message),
        pageModel.mode === 'request-invite-page' ? null : React.createElement(PrimaryAction, { pageModel }),
        React.createElement(RecoveryActions, { backHref: '/inventory' }),
      ),
    ),
  );
}

export function renderAccessRecoveryApp(pageModel) {
  return React.createElement(AccessRecoveryApp, { pageModel });
}
