import { getBoxPath } from './box-utils.js';

const PAGE_SIZE = 50;

function normalise(value) {
  return String(value ?? '').trim().toLowerCase();
}

function getBoxFields(box) {
  return [
    { key: 'boxCode', label: 'Box code', value: box.boxCode },
    { key: 'boxName', label: 'Box name', value: box.name },
    { key: 'locationSummary', label: 'Location', value: box.locationSummary },
    { key: 'notes', label: 'Notes', value: box.notes },
  ];
}

function getItemFields(item) {
  return [
    { key: 'itemName', label: 'Item name', value: item.name },
    { key: 'itemCategory', label: 'Category', value: item.category },
    { key: 'itemNotes', label: 'Notes', value: item.notes },
  ];
}

function getRank({ type, field, value, query }) {
  if (type === 'box' && field === 'boxCode' && value === query) {
    return 0;
  }

  if (type === 'box' && field === 'boxName' && value === query) {
    return 1;
  }

  if (field === 'boxCode' && value.startsWith(query)) {
    return 2;
  }

  if ((field === 'boxName' || field === 'itemName') && value.startsWith(query)) {
    return 3;
  }

  return 4;
}

function createPreview(label, value) {
  return `${label}: ${String(value ?? '').trim()}`;
}

export async function searchInventory(store, workspaceId, { query, includeArchived = false, offset = 0 } = {}) {
  const trimmedQuery = String(query ?? '').trim();
  const normalisedQuery = normalise(trimmedQuery);
  const safeOffset = Math.max(0, Number.isFinite(offset) ? Math.trunc(offset) : 0);

  if (!normalisedQuery) {
    return {
      query: trimmedQuery,
      includeArchived,
      offset: safeOffset,
      limit: PAGE_SIZE,
      total: 0,
      hasMore: false,
      results: [],
    };
  }

  const boxes = await store.listAllBoxesForWorkspace(workspaceId);
  const visibleBoxes = includeArchived ? boxes : boxes.filter((box) => box.status === 'active');
  const items = await store.listItemsForBoxIds(visibleBoxes.map((box) => box.id));
  const boxById = new Map(visibleBoxes.map((box) => [box.id, box]));
  const matches = [];

  for (const box of visibleBoxes) {
    for (const field of getBoxFields(box)) {
      const value = normalise(field.value);

      if (!value || !value.includes(normalisedQuery)) {
        continue;
      }

      matches.push({
        type: 'box',
        boxCode: box.boxCode,
        boxName: box.name,
        locationSummary: box.locationSummary,
        itemName: '',
        preview: createPreview(field.label, field.value),
        href: getBoxPath(box.boxCode),
        rank: getRank({ type: 'box', field: field.key, value, query: normalisedQuery }),
      });
      break;
    }
  }

  for (const item of items) {
    const box = boxById.get(item.boxId);

    if (!box) {
      continue;
    }

    for (const field of getItemFields(item)) {
      const value = normalise(field.value);

      if (!value || !value.includes(normalisedQuery)) {
        continue;
      }

      matches.push({
        type: 'item',
        boxCode: box.boxCode,
        boxName: box.name,
        locationSummary: box.locationSummary,
        itemName: item.name,
        preview: createPreview(field.label, field.value),
        href: getBoxPath(box.boxCode),
        rank: getRank({ type: 'item', field: field.key, value, query: normalisedQuery }),
      });
      break;
    }
  }

  matches.sort((left, right) => {
    if (left.rank !== right.rank) {
      return left.rank - right.rank;
    }

    return left.boxCode.localeCompare(right.boxCode) || left.itemName.localeCompare(right.itemName) || left.preview.localeCompare(right.preview);
  });

  const results = matches.slice(safeOffset, safeOffset + PAGE_SIZE);

  return {
    query: trimmedQuery,
    includeArchived,
    offset: safeOffset,
    limit: PAGE_SIZE,
    total: matches.length,
    hasMore: safeOffset + PAGE_SIZE < matches.length,
    results,
  };
}
