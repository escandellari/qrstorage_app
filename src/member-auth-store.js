import { randomUUID } from 'node:crypto';

export function createMemberAuthStore({ readData, writeData, withMutationLock }) {
  return {
    async findMemberByEmail(email) {
      const data = await readData();
      return data.members.find((member) => member.email.toLowerCase() === email.toLowerCase()) ?? null;
    },

    async findWorkspaceById(workspaceId) {
      const data = await readData();
      return data.workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
    },

    async createMagicLink(email, memberId, expiresAt, returnTo = '/inventory', inviteToken = null) {
      const data = await readData();
      const record = {
        token: randomUUID(),
        email,
        memberId,
        expiresAt,
        returnTo,
        inviteToken,
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
      return withMutationLock(async () => {
        const data = await readData();
        const magicLink = data.magicLinks.find((record) => record.token === token);

        if (!magicLink || magicLink.consumedAt || new Date(magicLink.expiresAt).getTime() <= Date.now()) {
          return null;
        }

        magicLink.consumedAt = consumedAt;
        await writeData(data);
        return magicLink;
      });
    },

    async findMemberById(memberId) {
      const data = await readData();
      return data.members.find((member) => member.id === memberId) ?? null;
    },

    async createInvite(workspaceId, email, expiresAt, returnTo = '/inventory') {
      return withMutationLock(async () => {
        const data = await readData();
        const invite = {
          token: randomUUID(),
          workspaceId,
          email,
          expiresAt,
          returnTo,
          acceptedAt: null,
        };
        data.invites.push(invite);
        await writeData(data);
        return invite;
      });
    },

    async findInvite(token) {
      const data = await readData();
      return data.invites.find((invite) => invite.token === token) ?? null;
    },

    async markInviteAccepted(token, acceptedAt) {
      return withMutationLock(async () => {
        const data = await readData();
        const invite = data.invites.find((record) => record.token === token);

        if (!invite) {
          return null;
        }

        invite.acceptedAt ??= acceptedAt;
        await writeData(data);
        return { ...invite };
      });
    },

    async createMember(workspaceId, email, role = 'member') {
      return withMutationLock(async () => {
        const data = await readData();
        const existingMember = data.members.find(
          (member) => member.workspaceId === workspaceId && member.email.toLowerCase() === email.toLowerCase(),
        );

        if (existingMember) {
          return existingMember;
        }

        const member = {
          id: randomUUID(),
          workspaceId,
          email,
          role,
        };
        data.members.push(member);
        await writeData(data);
        return member;
      });
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
