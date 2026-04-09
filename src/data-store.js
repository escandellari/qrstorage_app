import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getStoredBoxDetailsFromBox } from './box-details.js';
import { createMemberAuthStore } from './member-auth-store.js';
import { MAX_ITEMS_PER_BOX } from './item-utils.js';

function createEmptyData() {
  return {
    workspaces: [],
    members: [],
    boxes: [],
    items: [],
    magicLinks: [],
    invites: [],
    sessions: [],
  };
}
export async function createDataStore(dataDir, seedData = {}) {
  await mkdir(dataDir, { recursive: true });
  const filePath = join(dataDir, 'data.json');
  const initialData = {
    ...createEmptyData(),
    ...seedData,
    boxes: seedData.boxes ?? [],
    items: seedData.items ?? [],
    magicLinks: seedData.magicLinks ?? [],
    invites: seedData.invites ?? [],
    sessions: seedData.sessions ?? [],
  };

  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, JSON.stringify(initialData, null, 2));
  }
  async function readData() {
    const contents = await readFile(filePath, 'utf8');
    return {
      ...createEmptyData(),
      ...JSON.parse(contents),
    };
  }

  async function writeData(data) {
    await writeFile(filePath, JSON.stringify(data, null, 2));
  }

  let mutationQueue = Promise.resolve();

  function withMutationLock(callback) {
    const run = mutationQueue.then(callback, callback);
    mutationQueue = run.then(() => undefined, () => undefined);
    return run;
  }

  return {
    ...createMemberAuthStore({ readData, writeData, withMutationLock }),

    async createBox(workspaceId, { name, locationSummary, notes }) {
      return withMutationLock(async () => {
        const data = await readData();
        const nextCode = `BOX-${String(data.boxes.length + 1).padStart(4, '0')}`;
        const box = {
          id: randomUUID(),
          workspaceId,
          boxCode: nextCode,
          name,
          locationSummary,
          notes,
          status: 'active',
        };
        data.boxes.push(box);
        await writeData(data);
        return box;
      });
    },

    async findBoxByCode(boxCode) {
      const data = await readData();
      return data.boxes.find((box) => box.boxCode === boxCode) ?? null;
    },

    async updateBox(boxId, input, originalInput = input) {
      return withMutationLock(async () => {
        const data = await readData();
        const box = data.boxes.find((record) => record.id === boxId);

        if (!box) {
          return { status: 'deleted' };
        }

        const currentBoxDetails = getStoredBoxDetailsFromBox(box);
        const currentStructuredLocation = currentBoxDetails.structuredLocation ?? { site: '', room: '', area: '', shelf: '' };
        const originalStructuredLocation = originalInput.structuredLocation ?? { site: '', room: '', area: '', shelf: '' };
        const inputStructuredLocation = input.structuredLocation ?? { site: '', room: '', area: '', shelf: '' };
        const changedFields = ['name', 'notes', 'locationMode', 'simpleLocation'].filter((field) => input[field] !== originalInput[field]);
        const changedStructuredFields = ['site', 'room', 'area', 'shelf'].filter(
          (field) => inputStructuredLocation[field] !== originalStructuredLocation[field],
        );
        const hasConflict =
          changedFields.some((field) => currentBoxDetails[field] !== originalInput[field]) ||
          changedStructuredFields.some((field) => currentStructuredLocation[field] !== originalStructuredLocation[field]);

        if (hasConflict) {
          return {
            status: 'conflict',
            box: { ...box },
          };
        }

        Object.assign(box, input);
        await writeData(data);
        return {
          status: 'updated',
          box: { ...box },
        };
      });
    },

    async archiveBox(boxId) {
      return withMutationLock(async () => {
        const data = await readData();
        const box = data.boxes.find((record) => record.id === boxId);

        if (!box) {
          return null;
        }

        box.status = 'archived';
        await writeData(data);
        return { ...box };
      });
    },

    async restoreBox(boxId) {
      return withMutationLock(async () => {
        const data = await readData();
        const box = data.boxes.find((record) => record.id === boxId);

        if (!box) {
          return null;
        }

        box.status = 'active';
        await writeData(data);
        return { ...box };
      });
    },

    async listBoxesForWorkspace(workspaceId) {
      const data = await readData();
      return data.boxes.filter((box) => box.workspaceId === workspaceId && box.status === 'active');
    },
    async listAllBoxesForWorkspace(workspaceId) {
      const data = await readData();
      return data.boxes.filter((box) => box.workspaceId === workspaceId);
    },
    async listItemsForBox(boxId) {
      const data = await readData();
      return data.items.filter((item) => item.boxId === boxId);
    },
    async listItemsForBoxIds(boxIds) {
      const data = await readData();
      const allowedBoxIds = new Set(boxIds);
      return data.items.filter((item) => allowedBoxIds.has(item.boxId));
    },

    async createItem(boxId, { name, quantity = null, category = '', notes = '' }) {
      return withMutationLock(async () => {
        const data = await readData();

        if (data.items.filter((item) => item.boxId === boxId).length >= MAX_ITEMS_PER_BOX) {
          return null;
        }

        const item = {
          id: randomUUID(),
          boxId,
          name,
          quantity,
          category,
          notes,
        };
        data.items.push(item);
        await writeData(data);
        return item;
      });
    },

    async updateItem(boxId, itemId, input, originalInput = input) {
      return withMutationLock(async () => {
        const data = await readData();
        const item = data.items.find((record) => record.id === itemId && record.boxId === boxId);

        if (!item) {
          return { status: 'deleted' };
        }

        const fields = ['name', 'quantity', 'category', 'notes'];
        const changedFields = fields.filter((field) => input[field] !== originalInput[field]);
        const hasConflict = changedFields.some((field) => item[field] !== originalInput[field]);

        if (hasConflict) {
          return {
            status: 'conflict',
            item: { ...item },
          };
        }

        for (const field of changedFields) {
          item[field] = input[field];
        }

        await writeData(data);
        return {
          status: 'updated',
          item: { ...item },
        };
      });
    },

    async deleteItem(boxId, itemId) {
      return withMutationLock(async () => {
        const data = await readData();
        const itemIndex = data.items.findIndex((record) => record.id === itemId && record.boxId === boxId);

        if (itemIndex < 0) {
          return null;
        }

        const [deletedItem] = data.items.splice(itemIndex, 1);
        await writeData(data);
        return deletedItem;
      });
    },
  };
}
