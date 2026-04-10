import React from 'react';
import { renderToString } from 'react-dom/server';
import { renderPage } from '../html.js';
import { REACT_SHELL_ASSET_PATHS } from '../react-shell/constants.js';

function AuthLayout({ screen, title, children }) {
  return React.createElement(
    'main',
    {
      className: 'min-h-screen bg-slate-950 px-4 py-6 text-slate-50',
      'data-react-screen': screen,
    },
    React.createElement(
      'div',
      { className: 'mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-center' },
      React.createElement(
        'section',
        { className: 'rounded-3xl bg-slate-900 p-6 shadow-sm ring-1 ring-slate-800' },
        React.createElement('h1', { className: 'text-3xl font-semibold text-white' }, title),
        children,
      ),
    ),
  );
}

function SignInScreen({ returnTo = '', message = 'Enter your email to continue.' }) {
  return React.createElement(
    AuthLayout,
    { screen: 'sign-in', title: 'Sign in' },
    React.createElement('p', { className: 'mt-3 text-sm text-slate-300' }, message),
    React.createElement(
      'form',
      { method: 'post', action: '/sign-in', className: 'mt-6 space-y-4' },
      React.createElement('input', { type: 'hidden', name: 'returnTo', value: returnTo }),
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
      React.createElement('button', { type: 'submit', className: 'w-full rounded-xl bg-sky-500 px-4 py-2 font-medium text-slate-950' }, 'Send magic link'),
    ),
  );
}

function CheckEmailScreen() {
  return React.createElement(
    AuthLayout,
    { screen: 'check-email', title: 'Check your email' },
    React.createElement(
      'p',
      { className: 'mt-3 text-sm text-slate-300' },
      'If that email can access this workspace, we have sent a magic link.',
    ),
  );
}

function MagicLinkErrorScreen() {
  return React.createElement(
    AuthLayout,
    { screen: 'magic-link-error', title: 'This link has expired' },
    React.createElement('p', { className: 'mt-3 text-sm text-slate-300' }, 'Request a new magic link to continue.'),
    React.createElement(
      'p',
      { className: 'mt-6' },
      React.createElement('a', { href: '/sign-in', className: 'font-medium text-sky-300 underline' }, 'Request a new magic link'),
    ),
  );
}

function InviteErrorScreen() {
  return React.createElement(
    AuthLayout,
    { screen: 'invite-error', title: 'This invite link has expired' },
    React.createElement('p', { className: 'mt-3 text-sm text-slate-300' }, 'Request a new invite to continue.'),
    React.createElement(
      'p',
      { className: 'mt-6' },
      React.createElement('a', { href: '/sign-in', className: 'font-medium text-sky-300 underline' }, 'Request a new invite'),
    ),
  );
}

const screens = {
  'sign-in': { component: SignInScreen, title: 'Sign in' },
  'check-email': { component: CheckEmailScreen, title: 'Check your email' },
  'magic-link-error': { component: MagicLinkErrorScreen, title: 'Magic link error' },
  'invite-error': { component: InviteErrorScreen, title: 'Invite link error' },
};

export function renderAuthScreen(screen, pageModel = {}) {
  const definition = screens[screen];

  if (!definition) {
    throw new Error(`Unknown auth screen: ${screen}`);
  }

  const body = renderToString(React.createElement(definition.component, pageModel));

  return renderPage({
    title: definition.title,
    head: `<link rel="stylesheet" href="${REACT_SHELL_ASSET_PATHS.stylesheet}" />`,
    body,
  });
}
