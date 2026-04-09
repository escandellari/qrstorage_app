function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderArchivedBoxPage(box) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(box.boxCode)} archived</title>
  </head>
  <body>
    <main>
      <p><a href="/inventory">Inventory</a></p>
      <h1>Box archived</h1>
      <p><strong>Box code</strong>: ${escapeHtml(box.boxCode)}</p>
      <p><strong>Status</strong>: Archived</p>
      <form method="post" action="/boxes/${encodeURIComponent(box.boxCode)}/restore">
        <button type="submit">Restore box</button>
      </form>
    </main>
  </body>
</html>`;
}
