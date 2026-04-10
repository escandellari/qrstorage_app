import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemberAuthStore } from '../src/member-auth-store.js';

function createTestStore(initialData) {
  let data = structuredClone(initialData);
  let mutationQueue = Promise.resolve();

  const readData = async () => structuredClone(data);
  const writeData = async (nextData) => {
    data = structuredClone(nextData);
  };
  const withMutationLock = (callback) => {
    const run = mutationQueue.then(callback, callback);
    mutationQueue = run.then(() => undefined, () => undefined);
    return run;
  };

  return {
    store: createMemberAuthStore({ readData, writeData, withMutationLock }),
    readSnapshot() {
      return structuredClone(data);
    },
  };
}

test('removeWorkspaceMember keeps one owner when owner removals race', async () => {
  const { store, readSnapshot } = createTestStore({
    workspaces: [{ id: 'workspace-1', name: 'Home Base' }],
    members: [
      { id: 'member-1', email: 'owner-1@example.com', workspaceId: 'workspace-1', role: 'owner' },
      { id: 'member-2', email: 'owner-2@example.com', workspaceId: 'workspace-1', role: 'owner' },
    ],
    boxes: [],
    items: [],
    magicLinks: [],
    invites: [],
    sessions: [],
  });

  const [firstResult, secondResult] = await Promise.all([
    store.removeWorkspaceMember('workspace-1', 'member-1'),
    store.removeWorkspaceMember('workspace-1', 'member-2'),
  ]);

  assert.deepEqual(
    [firstResult.status, secondResult.status].sort(),
    ['last_owner', 'removed'],
  );

  const remainingOwners = readSnapshot().members.filter((member) => member.workspaceId === 'workspace-1' && member.role === 'owner');
  assert.equal(remainingOwners.length, 1);
});
