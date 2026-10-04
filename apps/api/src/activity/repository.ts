import { prisma } from '@taskflow/database';
import type { Prisma } from '@taskflow/database';

export const activityRepository = {
  workspaceRole(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });
  },
  async list(where: Prisma.ActivityLogWhereInput, skip: number, take: number) {
    const [items, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          action: true,
          metadata: true,
          createdAt: true,
          actor: { select: { id: true, name: true, imageUrl: true } },
          project: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);
    return { items, total };
  },
};
