import { createTestServer, defaultSeedData } from './test-server.js';

export const defaultBox = {
  id: 'box-1',
  workspaceId: 'workspace-1',
  boxCode: 'BOX-0042',
  name: 'Camping Kit',
  locationSummary: 'Garage shelf',
  notes: '',
  status: 'active',
};

export const defaultItem = {
  id: 'item-1',
  boxId: 'box-1',
  name: 'Tent pegs',
  quantity: 12,
  category: 'Camping',
  notes: 'Stored in a mesh bag.',
};

export const editorMember = {
  id: 'member-2',
  email: 'editor@example.com',
  workspaceId: 'workspace-1',
  role: 'member',
};

export const workspaceMembers = [...defaultSeedData.members, editorMember];

export async function createBoxItemsTestApp({ members = defaultSeedData.members, items = [defaultItem] } = {}) {
  return createTestServer({
    seedData: {
      ...defaultSeedData,
      members,
      boxes: [defaultBox],
      items,
    },
  });
}
