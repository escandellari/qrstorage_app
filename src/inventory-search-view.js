import { escapeHtml, renderPage } from './html.js';
import { renderInventorySearchForm } from './inventory-search-form.js';

function renderLoadMore({ query, includeArchived, nextOffset }) {
  const params = new URLSearchParams({ q: query, offset: String(nextOffset) });

  if (includeArchived) {
    params.set('includeArchived', '1');
  }

  return `<p><a href="/inventory/search?${escapeHtml(params.toString())}">Load more</a></p>`;
}

export function renderInventorySearchPage(workspace, search) {
  const results = search.results
    .map(
      (result) => `<li>
        <a href="${escapeHtml(result.href)}">
          <strong>${escapeHtml(result.type === 'box' ? 'Box match' : 'Item match')}</strong>
          <span>Box code: ${escapeHtml(result.boxCode)}</span>
          <span>Box name: ${escapeHtml(result.boxName)}</span>
          ${result.locationSummary ? `<span>Location: ${escapeHtml(result.locationSummary)}</span>` : ''}
          ${result.itemName ? `<span>Item name: ${escapeHtml(result.itemName)}</span>` : ''}
          <span>${escapeHtml(result.preview)}</span>
        </a>
      </li>`,
    )
    .join('');

  return renderPage({
    title: `Search inventory for ${search.query}`,
    body: `
      <main>
        <p><a href="/inventory">Inventory</a></p>
        <h1>Search inventory</h1>
        <p>${escapeHtml(workspace.name)}</p>
        ${renderInventorySearchForm(search)}
        ${search.results.length > 0 ? `<ul>${results}</ul>` : `<section>
          <h2>No matches</h2>
          <p>No matches for “${escapeHtml(search.query)}”.</p>
          <p><a href="/inventory">Reset search</a></p>
        </section>`}
        ${search.hasMore ? renderLoadMore({ query: search.query, includeArchived: search.includeArchived, nextOffset: search.offset + search.limit }) : ''}
      </main>
    `,
  });
}
