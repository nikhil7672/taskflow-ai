import { prisma } from '@taskflow/database';
import type { Prisma } from '@taskflow/database';
import { HttpError } from '../core/http.js';
import { wouldCreateDependencyCycle } from './dependency-policy.js';

export const taskSelect = {
  id: true,
  projectId: true,
  createdById: true,
  assigneeId: true,
  parentId: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  position: true,
  startAt: true,
  dueAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  assignee: { select: { id: true, name: true, email: true, imageUrl: true } },
} satisfies Prisma.TaskSelect;

export const taskRepository = {
  async list(projectId: string, where: Prisma.TaskWhereInput, skip: number, take: number) {
    const scope = { projectId, ...where };
    const [items, total] = await prisma.$transaction([
      prisma.task.findMany({
        where: scope,
        select: taskSelect,
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      prisma.task.count({ where: scope }),
    ]);
    return { items, total };
  },
  async create(
    projectId: string,
    actorId: string,
    data: Pick<
      Prisma.TaskUncheckedCreateInput,
      | 'title'
      | 'description'
      | 'status'
      | 'priority'
      | 'assigneeId'
      | 'parentId'
      | 'startAt'
      | 'dueAt'
      | 'completedAt'
    >,
  ) {
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({
        where: { id: projectId },
        select: { workspaceId: true },
      });
      if (typeof data.assigneeId === 'string') {
        const assignee = await tx.workspaceMember.findUnique({
          where: {
            workspaceId_userId: { workspaceId: project.workspaceId, userId: data.assigneeId },
          },
          select: { id: true },
        });
        if (!assignee)
          throw new HttpError(400, 'INVALID_ASSIGNEE', 'Assignee must belong to this workspace');
      }
      if (typeof data.parentId === 'string') {
        const parent = await tx.task.findFirst({
          where: { id: data.parentId, projectId },
          select: { id: true },
        });
        if (!parent)
          throw new HttpError(400, 'INVALID_PARENT', 'Parent task must belong to this project');
      }
      const task = await tx.task.create({
        data: { ...data, projectId, createdById: actorId },
        select: taskSelect,
      });
      await tx.activityLog.create({
        data: {
          workspaceId: project.workspaceId,
          actorId,
          projectId,
          taskId: task.id,
          action: 'task.created',
        },
      });
      return task;
    });
  },
  async get(taskId: string) {
    return prisma.task.findUnique({ where: { id: taskId }, select: taskSelect });
  },
  async update(
    taskId: string,
    actorId: string,
    data: Prisma.TaskUncheckedUpdateInput,
    action: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.task.findUniqueOrThrow({
        where: { id: taskId },
        select: { projectId: true },
      });
      const project = await tx.project.findUniqueOrThrow({
        where: { id: current.projectId },
        select: { workspaceId: true },
      });
      if (typeof data.assigneeId === 'string') {
        const assignee = await tx.workspaceMember.findUnique({
          where: {
            workspaceId_userId: { workspaceId: project.workspaceId, userId: data.assigneeId },
          },
          select: { id: true },
        });
        if (!assignee)
          throw new HttpError(400, 'INVALID_ASSIGNEE', 'Assignee must belong to this workspace');
      }
      if (typeof data.parentId === 'string') {
        if (data.parentId === taskId)
          throw new HttpError(400, 'INVALID_PARENT', 'A task cannot be its own parent');
        const parent = await tx.task.findFirst({
          where: { id: data.parentId, projectId: current.projectId },
          select: { id: true },
        });
        if (!parent)
          throw new HttpError(400, 'INVALID_PARENT', 'Parent task must belong to this project');
      }
      const task = await tx.task.update({ where: { id: taskId }, data, select: taskSelect });
      await tx.activityLog.create({
        data: {
          workspaceId: project.workspaceId,
          actorId,
          projectId: task.projectId,
          taskId,
          action,
        },
      });
      return task;
    });
  },
  async remove(taskId: string, actorId: string) {
    await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUniqueOrThrow({
        where: { id: taskId },
        select: { projectId: true },
      });
      const project = await tx.project.findUniqueOrThrow({
        where: { id: task.projectId },
        select: { workspaceId: true },
      });
      await tx.activityLog.create({
        data: {
          workspaceId: project.workspaceId,
          actorId,
          projectId: task.projectId,
          action: 'task.deleted',
          metadata: { taskId },
        },
      });
      await tx.task.delete({ where: { id: taskId } });
    });
  },
  async userIsWorkspaceMember(projectId: string, userId: string) {
    const taskProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true },
    });
    if (!taskProject) return false;
    return Boolean(
      await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: taskProject.workspaceId, userId } },
        select: { id: true },
      }),
    );
  },
  async parentBelongsToProject(parentId: string, projectId: string) {
    return Boolean(
      await prisma.task.findFirst({ where: { id: parentId, projectId }, select: { id: true } }),
    );
  },
  async comments(taskId: string, skip: number, take: number) {
    const [items, total] = await prisma.$transaction([
      prisma.taskComment.findMany({
        where: { taskId },
        orderBy: { createdAt: 'asc' },
        skip,
        take,
        select: {
          id: true,
          taskId: true,
          content: true,
          editedAt: true,
          createdAt: true,
          author: { select: { id: true, name: true, imageUrl: true } },
        },
      }),
      prisma.taskComment.count({ where: { taskId } }),
    ]);
    return { items, total };
  },
  async addComment(taskId: string, actorId: string, content: string) {
    return prisma.$transaction(async (tx) => {
      const comment = await tx.taskComment.create({
        data: { taskId, authorId: actorId, content },
        select: {
          id: true,
          taskId: true,
          content: true,
          createdAt: true,
          author: { select: { id: true, name: true, imageUrl: true } },
        },
      });
      const task = await tx.task.findUniqueOrThrow({
        where: { id: taskId },
        select: { projectId: true },
      });
      const project = await tx.project.findUniqueOrThrow({
        where: { id: task.projectId },
        select: { workspaceId: true },
      });
      await tx.activityLog.create({
        data: {
          workspaceId: project.workspaceId,
          actorId,
          projectId: task.projectId,
          taskId,
          action: 'task.comment_added',
          metadata: { commentId: comment.id },
        },
      });
      return comment;
    });
  },
  dependencies(taskId: string) {
    return prisma.taskDependency.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      select: {
        taskId: true,
        dependsOnId: true,
        createdAt: true,
        dependsOn: {
          select: { id: true, title: true, status: true, priority: true, dueAt: true },
        },
      },
    });
  },
  addDependency(taskId: string, dependsOnId: string, actorId: string) {
    return prisma.$transaction(
      async (tx) => {
        const [task, requiredTask] = await Promise.all([
          tx.task.findUnique({ where: { id: taskId }, select: { projectId: true } }),
          tx.task.findUnique({ where: { id: dependsOnId }, select: { projectId: true } }),
        ]);
        if (!task || !requiredTask || task.projectId !== requiredTask.projectId) {
          throw new HttpError(
            400,
            'INVALID_DEPENDENCY',
            'Dependencies must connect tasks in the same project',
          );
        }
        const edges = await tx.taskDependency.findMany({
          where: { task: { projectId: task.projectId } },
          select: { taskId: true, dependsOnId: true },
        });
        if (wouldCreateDependencyCycle(edges, taskId, dependsOnId)) {
          throw new HttpError(409, 'DEPENDENCY_CYCLE', 'This dependency would create a cycle');
        }
        const dependency = await tx.taskDependency.create({
          data: { taskId, dependsOnId },
          select: {
            taskId: true,
            dependsOnId: true,
            createdAt: true,
            dependsOn: {
              select: { id: true, title: true, status: true, priority: true, dueAt: true },
            },
          },
        });
        const project = await tx.project.findUniqueOrThrow({
          where: { id: task.projectId },
          select: { workspaceId: true },
        });
        await tx.activityLog.create({
          data: {
            workspaceId: project.workspaceId,
            projectId: task.projectId,
            taskId,
            actorId,
            action: 'task.dependency_added',
            metadata: { dependsOnId },
          },
        });
        return dependency;
      },
      { isolationLevel: 'Serializable' },
    );
  },
  async removeDependency(taskId: string, dependsOnId: string, actorId: string) {
    await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUniqueOrThrow({
        where: { id: taskId },
        select: { projectId: true },
      });
      await tx.taskDependency.delete({ where: { taskId_dependsOnId: { taskId, dependsOnId } } });
      const project = await tx.project.findUniqueOrThrow({
        where: { id: task.projectId },
        select: { workspaceId: true },
      });
      await tx.activityLog.create({
        data: {
          workspaceId: project.workspaceId,
          projectId: task.projectId,
          taskId,
          actorId,
          action: 'task.dependency_removed',
          metadata: { dependsOnId },
        },
      });
    });
  },
};
