import React from 'react';

function buildSearchHref({ query, includeArchived, offset = 0 }) {
  const params = new URLSearchParams({ q: query });

  if (offset > 0) {
    params.set('offset', String(offset));
  }

  if (includeArchived) {
    params.set('includeArchived', '1');
  }

  return `/inventory/search?${params.toString()}`;
}

function SearchForm({ query, includeArchived }) {
  return React.createElement(
    'form',
    { method: 'get', action: '/inventory/search', className: 'space-y-3 rounded-2xl bg-slate-900 p-4 shadow-sm ring-1 ring-slate-800' },
    React.createElement(
      'label',
      { className: 'block text-sm text-slate-200' },
      React.createElement('span', { className: 'mb-1 block font-medium' }, 'Search inventory'),
      React.createElement('input', {
        type: 'search',
        name: 'q',
        defaultValue: query,
        className: 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-white',
      }),
    ),
    React.createElement(
      'label',
      { className: 'flex items-center gap-2 text-sm text-slate-200' },
      React.createElement('input', { type: 'checkbox', name: 'includeArchived', value: '1', defaultChecked: includeArchived }),
      React.createElement('span', null, 'Include archived'),
    ),
    React.createElement('button', { type: 'submit', className: 'rounded-xl bg-sky-500 px-4 py-2 font-medium text-slate-950' }, 'Search'),
  );
}

function SearchResultRow({ result }) {
  return React.createElement(
    'li',
    null,
    React.createElement(
      'a',
      {
        href: result.href,
        'data-search-result-row': 'true',
        className:
          'block rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-50 ring-offset-slate-950 transition hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400',
      },
      React.createElement(
        'div',
        { className: 'flex items-start justify-between gap-3' },
        React.createElement('p', { className: 'text-sm font-semibold text-white' }, result.type === 'box' ? 'Box match' : 'Item match'),
        React.createElement('p', { className: 'text-xs uppercase tracking-[0.2em] text-slate-400' }, `Box code: ${result.boxCode}`),
      ),
      React.createElement('p', { className: 'mt-2 text-sm font-medium text-white' }, `Box name: ${result.boxName}`),
      result.itemName ? React.createElement('p', { className: 'mt-1 text-sm text-slate-300' }, `Item name: ${result.itemName}`) : null,
      result.locationSummary ? React.createElement('p', { className: 'mt-1 text-sm text-slate-300' }, `Location: ${result.locationSummary}`) : null,
      React.createElement('p', { className: 'mt-2 text-sm text-slate-300' }, result.preview),
    ),
  );
}

function SearchResults({ search }) {
  if (search.results.length === 0) {
    return React.createElement(
      'section',
      { className: 'rounded-2xl bg-slate-900 p-4 shadow-sm ring-1 ring-slate-800' },
      React.createElement('h2', { className: 'text-lg font-semibold text-white' }, 'No matches'),
      React.createElement('p', { className: 'mt-2 text-sm text-slate-300' }, `No matches for “${search.query}”.`),
      React.createElement(
        'p',
        { className: 'mt-4' },
        React.createElement('a', { href: '/inventory', className: 'font-medium text-sky-300 underline' }, 'Back to inventory'),
      ),
    );
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'ul',
      { className: 'space-y-3' },
      search.results.map((result) => React.createElement(SearchResultRow, { key: `${result.type}:${result.boxCode}:${result.itemName}:${result.preview}`, result })),
    ),
    search.hasMore
      ? React.createElement(
          'p',
          { className: 'pt-1' },
          React.createElement(
            'a',
            {
              href: buildSearchHref({
                query: search.query,
                includeArchived: search.includeArchived,
                offset: search.offset + search.limit,
              }),
              className: 'inline-flex rounded-xl bg-slate-800 px-4 py-2 font-medium text-slate-100',
            },
            'Load more',
          ),
        )
      : null,
  );
}

function InventorySearch({ workspaceName, search }) {
  return React.createElement(
    'main',
    {
      className: 'min-h-screen bg-slate-950 px-4 py-6 text-slate-50',
      'data-react-screen': 'inventory-search',
    },
    React.createElement(
      'div',
      { className: 'mx-auto flex max-w-md flex-col gap-4' },
      React.createElement(
        'header',
        { className: 'space-y-1' },
        React.createElement('p', { className: 'text-sm font-medium uppercase tracking-[0.2em] text-slate-300' }, workspaceName),
        React.createElement('h1', { className: 'text-3xl font-semibold text-white' }, 'Search inventory'),
        React.createElement(
          'p',
          null,
          React.createElement('a', { href: '/inventory', className: 'font-medium text-sky-300 underline' }, 'Inventory'),
        ),
      ),
      React.createElement(SearchForm, { query: search.query, includeArchived: search.includeArchived }),
      React.createElement(SearchResults, { search }),
    ),
  );
}

export function renderInventorySearchApp(pageModel) {
  return React.createElement(InventorySearch, pageModel);
}
