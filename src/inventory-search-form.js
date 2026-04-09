import { escapeHtml } from './html.js';

export function renderInventorySearchForm({ query = '', includeArchived = false } = {}) {
  return `<form method="get" action="/inventory/search">
    <label>
      Search inventory
      <input type="search" name="q" value="${escapeHtml(query)}" />
    </label>
    <label>
      <input type="checkbox" name="includeArchived" value="1" ${includeArchived ? 'checked' : ''} />
      Include archived
    </label>
    <button type="submit">Search</button>
  </form>`;
}
