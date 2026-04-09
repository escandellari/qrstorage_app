import { getLabelPath } from './box-utils.js';
import { ITEM_LIMIT_MESSAGE, MAX_ITEMS_PER_BOX } from './item-utils.js';

export function getItemValues(form) {
  return {
    name: String(form.get('name') ?? '').trim(),
    quantity: String(form.get('quantity') ?? '').trim(),
    category: String(form.get('category') ?? '').trim(),
    notes: String(form.get('notes') ?? '').trim(),
  };
}

export function getCreateItemInput(itemValues) {
  return {
    name: itemValues.name,
    quantity: itemValues.quantity ? Number(itemValues.quantity) : null,
    category: itemValues.category,
    notes: itemValues.notes,
  };
}

export function isBoxAtItemLimit(items) {
  return items.length >= MAX_ITEMS_PER_BOX;
}

export async function getBoxPageOptions(store, box, overrides = {}) {
  const items = await store.listItemsForBox(box.id);

  return {
    labelPath: getLabelPath(box.boxCode),
    items,
    itemLimitMessage: isBoxAtItemLimit(items) ? ITEM_LIMIT_MESSAGE : '',
    ...overrides,
  };
}
