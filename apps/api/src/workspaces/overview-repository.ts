import { prisma } from '@taskflow/database';
import type { Prisma } from '@taskflow/database';

export const workspaceOverviewRepository = {
  role(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });
  },
  async get(workspaceId: string, userId: string, admin: boolean, monthStart: Date) {
    const projectWhere: Prisma.ProjectWhereInput = {
      workspaceId,
      ...(admin ? {} : { members: { some: { userId } } }),
    };
    const taskWhere: Prisma.TaskWhereInput = { project: projectWhere };
    const activityWhere: Prisma.ActivityLogWhereInput = {
      workspaceId,
      ...(admin ? {} : { OR: [{ projectId: null }, { project: { is: projectWhere } }] }),
    };
    const [
      projects,
      projectCount,
      projectStatusGroups,
      taskGroups,
      inProgress,
      completedThisMonth,
      upcomingTasks,
      activity,
      memberCount,
    ] = await prisma.$transaction([
      prisma.project.findMany({
        where: projectWhere,
        orderBy: { updatedAt: 'desc' },
        take: 100,
        select: {
          id: true,
          workspaceId: true,
          name: true,
          slug: true,
          description: true,
          status: true,
          color: true,
          dueDate: true,
          updatedAt: true,
          _count: { select: { members: true } },
        },
      }),
      prisma.project.count({ where: projectWhere }),
      prisma.project.groupBy({
        by: ['status'],
        where: projectWhere,
        orderBy: { status: 'asc' },
        _count: { id: true },
      }),
      prisma.task.groupBy({
        by: ['projectId', 'status'],
        where: taskWhere,
        orderBy: [{ projectId: 'asc' }, { status: 'asc' }],
        _count: { id: true },
      }),
      prisma.task.count({ where: { ...taskWhere, status: 'IN_PROGRESS' } }),
      prisma.task.count({
        where: { ...taskWhere, status: 'DONE', completedAt: { gte: monthStart } },
      }),
      prisma.task.findMany({
        where: {
          ...taskWhere,
          dueAt: { not: null },
          status: { notIn: ['DONE', 'CANCELED'] },
        },
        orderBy: { dueAt: 'asc' },
        take: 5,
        select: {
          id: true,
          title: true,
          dueAt: true,
          priority: true,
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.activityLog.findMany({
        where: activityWhere,
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          action: true,
          metadata: true,
          createdAt: true,
          actor: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } },
        },
      }),
      prisma.workspaceMember.count({ where: { workspaceId } }),
    ]);

    const statsByProject = new Map<string, { total: number; completed: number }>();
    const totals = { total: 0, completed: 0, inProgress: 0, todo: 0 };
    for (const group of taskGroups) {
      const count =
        typeof group._count === 'object' && group._count !== null ? (group._count.id ?? 0) : 0;
      const stats = statsByProject.get(group.projectId) ?? { total: 0, completed: 0 };
      stats.total += count;
      if (group.status === 'DONE') stats.completed += count;
      if (group.status === 'IN_PROGRESS') totals.inProgress += count;
      if (group.status === 'TODO' || group.status === 'BACKLOG') totals.todo += count;
      totals.total += count;
      if (group.status === 'DONE') totals.completed += count;
      statsByProject.set(group.projectId, stats);
    }

    return {
      projects: projects.map((project) => {
        const stats = statsByProject.get(project.id) ?? { total: 0, completed: 0 };
        return {
          ...project,
          taskCount: stats.total,
          completedTaskCount: stats.completed,
          progress: stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100),
        };
      }),
      stats: {
        ...totals,
        inProgress,
        completedThisMonth,
        memberCount,
        projectCount,
        activeProjectCount: projectStatusGroups
          .filter((group) => ['PLANNING', 'ACTIVE', 'ON_HOLD'].includes(group.status))
          .reduce(
            (total, group) =>
              total +
              (typeof group._count === 'object' && group._count !== null
                ? (group._count.id ?? 0)
                : 0),
            0,
          ),
      },
      upcomingTasks,
      activity,
    };
  },
};
