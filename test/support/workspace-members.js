import { defaultSeedData } from './test-server.js';

export function createWorkspaceMembersSeedData({
  members = [],
  workspaces = [],
  boxes = [],
} = {}) {
  return {
    ...defaultSeedData,
    workspaces: [...defaultSeedData.workspaces, ...workspaces],
    members: [...defaultSeedData.members, ...members],
    boxes,
  };
}

export function createWorkspaceMember(email = 'member@example.com', options = {}) {
  return {
    id: options.id ?? 'member-2',
    email,
    workspaceId: options.workspaceId ?? 'workspace-1',
    role: options.role ?? 'member',
  };
}
