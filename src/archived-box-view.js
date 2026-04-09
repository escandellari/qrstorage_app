import { escapeHtml, renderPage } from './html.js';

export function renderArchivedBoxPage(box) {
  return renderPage({
    title: `${box.boxCode} archived`,
    body: `<main>
      <p><a href="/inventory">Inventory</a></p>
      <h1>Box archived</h1>
      <p><strong>Box code</strong>: ${escapeHtml(box.boxCode)}</p>
      <p><strong>Status</strong>: Archived</p>
      <form method="post" action="/boxes/${encodeURIComponent(box.boxCode)}/restore">
        <button type="submit">Restore box</button>
      </form>
    </main>`,
  });
}
