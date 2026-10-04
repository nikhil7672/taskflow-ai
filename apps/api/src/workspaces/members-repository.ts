import { prisma } from '@taskflow/database';

type AssignableWorkspaceRole = 'ADMIN' | 'MEMBER' | 'GUEST';

export const workspaceMemberRepository = {
  role(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });
  },
  async list(workspaceId: string, skip: number, take: number) {
    const [items, total] = await prisma.$transaction([
      prisma.workspaceMember.findMany({
        where: { workspaceId },
        orderBy: { joinedAt: 'asc' },
        skip,
        take,
        select: {
          role: true,
          joinedAt: true,
          user: { select: { id: true, name: true, email: true, imageUrl: true } },
        },
      }),
      prisma.workspaceMember.count({ where: { workspaceId } }),
    ]);
    return { items, total };
  },
  memberRole(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });
  },
  async changeRole(
    workspaceId: string,
    userId: string,
    actorId: string,
    from: string,
    role: AssignableWorkspaceRole,
  ) {
    return prisma.$transaction(async (tx) => {
      const member = await tx.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId } },
        data: { role },
        select: { userId: true, role: true, updatedAt: true },
      });
      await tx.activityLog.create({
        data: {
          workspaceId,
          actorId,
          action: 'workspace.member_role_changed',
          metadata: { userId, from, to: role },
        },
      });
      return member;
    });
  },
  async remove(workspaceId: string, userId: string, actorId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.activityLog.create({
        data: { workspaceId, actorId, action: 'workspace.member_removed', metadata: { userId } },
      });
      await tx.workspaceMember.delete({ where: { workspaceId_userId: { workspaceId, userId } } });
    });
  },
};
