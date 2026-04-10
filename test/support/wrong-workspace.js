import { defaultSeedData } from './test-server.js';

export const WRONG_WORKSPACE_BOX_CODE = 'BOX-0042';
export const WRONG_WORKSPACE_ID = 'workspace-2';

export function createWrongWorkspaceSeedData({ includeTargetMembership = true, items = [] } = {}) {
  return {
    ...defaultSeedData,
    workspaces: [...defaultSeedData.workspaces, { id: WRONG_WORKSPACE_ID, name: 'Studio' }],
    members: includeTargetMembership
      ? [...defaultSeedData.members, { id: 'member-2', email: 'owner@example.com', workspaceId: WRONG_WORKSPACE_ID, role: 'owner' }]
      : defaultSeedData.members,
    boxes: [
      {
        id: 'box-1',
        workspaceId: WRONG_WORKSPACE_ID,
        boxCode: WRONG_WORKSPACE_BOX_CODE,
        name: 'Camping Kit',
        locationSummary: 'Garage shelf',
        notes: 'Check stove fuel before summer.',
        status: 'active',
      },
    ],
    items,
  };
}
