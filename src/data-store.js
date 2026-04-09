import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

function createEmptyData() {
  return {
    workspaces: [],
    members: [],
    magicLinks: [],
    sessions: [],
  };
}

export async function createDataStore(dataDir, seedData = {}) {
  await mkdir(dataDir, { recursive: true });
  const filePath = join(dataDir, 'data.json');
  const initialData = {
    ...createEmptyData(),
    ...seedData,
    magicLinks: seedData.magicLinks ?? [],
    sessions: seedData.sessions ?? [],
  };

  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, JSON.stringify(initialData, null, 2));
  }

  async function readData() {
    const contents = await readFile(filePath, 'utf8');
    return JSON.parse(contents);
  }

  async function writeData(data) {
    await writeFile(filePath, JSON.stringify(data, null, 2));
  }

  return {
    async findMemberByEmail(email) {
      const data = await readData();
      return data.members.find((member) => member.email.toLowerCase() === email.toLowerCase()) ?? null;
    },

    async findWorkspaceById(workspaceId) {
      const data = await readData();
      return data.workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
    },

    async createMagicLink(email, memberId, expiresAt) {
      const data = await readData();
      const record = {
        token: randomUUID(),
        email,
        memberId,
        expiresAt,
        consumedAt: null,
      };
      data.magicLinks.push(record);
      await writeData(data);
      return record;
    },

    async findMagicLink(token) {
      const data = await readData();
      return data.magicLinks.find((magicLink) => magicLink.token === token) ?? null;
    },

    async consumeMagicLink(token, consumedAt) {
      const data = await readData();
      const magicLink = data.magicLinks.find((record) => record.token === token);

      if (!magicLink) {
        return null;
      }

      magicLink.consumedAt = consumedAt;
      await writeData(data);
      return magicLink;
    },

    async findMemberById(memberId) {
      const data = await readData();
      return data.members.find((member) => member.id === memberId) ?? null;
    },

    async createSession(memberId) {
      const data = await readData();
      const session = {
        id: randomUUID(),
        memberId,
      };
      data.sessions.push(session);
      await writeData(data);
      return session;
    },

    async findSession(sessionId) {
      const data = await readData();
      return data.sessions.find((session) => session.id === sessionId) ?? null;
    },
  };
}
