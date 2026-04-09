export function renderBoxActions({ escapeHtml, labelPath }) {
  return `<nav>
    <p><a href="/inventory">Inventory</a></p>
    <p><a href="/inventory/search">Search inventory</a></p>
    <p><a href="${escapeHtml(labelPath)}">Print label</a></p>
  </nav>`;
}

export function renderBoxItemsSection({
  boxCode,
  items,
  editItemId,
  editItemValues,
  editItemErrors,
  editOriginalItemValues,
  conflictItemId,
  conflictItem,
  escapeHtml,
}) {
  if (items.length === 0) {
    return '<section><h2>Contents</h2><p>Add the first item to this box.</p></section>';
  }

  const itemMarkup = items
    .map((item) => {
      const details = [
        item.quantity ? `Quantity: ${escapeHtml(item.quantity)}` : '',
        item.category ? `Category: ${escapeHtml(item.category)}` : '',
        item.notes ? `Notes: ${escapeHtml(item.notes)}` : '',
      ]
        .filter(Boolean)
        .join(' · ');
      const editValues =
        item.id === editItemId
          ? editItemValues
          : {
              name: item.name,
              quantity: item.quantity ? String(item.quantity) : '',
              category: item.category,
              notes: item.notes,
            };
      const editErrors = item.id === editItemId ? editItemErrors : {};
      const originalValues =
        item.id === editItemId
          ? editOriginalItemValues
          : {
              name: item.name,
              quantity: item.quantity ? String(item.quantity) : '',
              category: item.category,
              notes: item.notes,
            };
      const conflictMessage =
        item.id === conflictItemId && conflictItem
          ? `<div><p>This item was updated by someone else.</p><p>Latest saved item: ${escapeHtml(conflictItem.name)}${conflictItem.quantity ? ` · Quantity: ${escapeHtml(conflictItem.quantity)}` : ''}${conflictItem.category ? ` · Category: ${escapeHtml(conflictItem.category)}` : ''}${conflictItem.notes ? ` · Notes: ${escapeHtml(conflictItem.notes)}` : ''}</p></div>`
          : '';

      return `<li><strong>${escapeHtml(item.name)}</strong>${details ? `<div>${details}</div>` : ''}${conflictMessage}
        <form method="post" action="/boxes/${encodeURIComponent(boxCode)}/items/${encodeURIComponent(item.id)}">
          <label>
            Item name
            <input type="text" name="name" value="${escapeHtml(editValues.name ?? '')}" required />
          </label>
          ${editErrors.name ? `<p>${escapeHtml(editErrors.name)}</p>` : ''}
          <label>
            Quantity
            <input type="text" name="quantity" inputmode="numeric" value="${escapeHtml(editValues.quantity ?? '')}" />
          </label>
          ${editErrors.quantity ? `<p>${escapeHtml(editErrors.quantity)}</p>` : ''}
          <label>
            Category
            <input type="text" name="category" value="${escapeHtml(editValues.category ?? '')}" />
          </label>
          ${editErrors.category ? `<p>${escapeHtml(editErrors.category)}</p>` : ''}
          <label>
            Notes
            <textarea name="notes">${escapeHtml(editValues.notes ?? '')}</textarea>
          </label>
          ${editErrors.notes ? `<p>${escapeHtml(editErrors.notes)}</p>` : ''}
          <input type="hidden" name="_method" value="PATCH" />
          <input type="hidden" name="originalName" value="${escapeHtml(originalValues.name ?? '')}" />
          <input type="hidden" name="originalQuantity" value="${escapeHtml(originalValues.quantity ?? '')}" />
          <input type="hidden" name="originalCategory" value="${escapeHtml(originalValues.category ?? '')}" />
          <input type="hidden" name="originalNotes" value="${escapeHtml(originalValues.notes ?? '')}" />
          <button type="submit" formmethod="post">Save changes</button>
        </form>
        <form method="post" action="/boxes/${encodeURIComponent(boxCode)}/items/${encodeURIComponent(item.id)}/delete">
          <button type="submit">Delete item</button>
        </form>
      </li>`;
    })
    .join('');

  return `<section><h2>Contents</h2><ul>${itemMarkup}</ul></section>`;
}
