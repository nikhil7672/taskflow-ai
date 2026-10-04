import { z } from 'zod';
import type { AuthLocals } from '../auth/middleware.js';
import { HttpError, omitUndefined, paginated, parsePage } from '../core/http.js';
import { assertProjectAccess } from '../projects/service.js';
import { taskRepository as repo } from './repository.js';
import type { z as Zod } from 'zod';
import {
  taskAssigneeSchema,
  taskCommentSchema,
  taskCreateSchema,
  taskDependencySchema,
  taskStatusSchema,
  taskUpdateSchema,
} from './schemas.js';

type Actor = NonNullable<AuthLocals['auth']>;
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().cuid().or(z.literal('unassigned')).optional(),
  search: z.string().trim().max(120).optional(),
  dueBefore: z.string().datetime({ offset: true }).optional(),
  dueAfter: z.string().datetime({ offset: true }).optional(),
});

async function taskForActor(taskId: string, actor: Actor, level: 'read' | 'write' | 'admin') {
  const task = await repo.get(taskId);
  if (!task) throw new HttpError(404, 'NOT_FOUND', 'Task not found');
  await assertProjectAccess(task.projectId, actor, level);
  return task;
}

export const taskService = {
  async list(projectId: string, actor: Actor, rawQuery: Record<string, unknown>) {
    await assertProjectAccess(projectId, actor, 'read');
    const query = listQuerySchema.safeParse(rawQuery);
    if (!query.success) throw new HttpError(400, 'INVALID_REQUEST', 'Invalid task filters');
    const { page, pageSize, skip, take } = parsePage({
      page: query.data.page ?? 1,
      pageSize: query.data.pageSize ?? 20,
    });
    const where = {
      ...(query.data.status ? { status: query.data.status } : {}),
      ...(query.data.priority ? { priority: query.data.priority } : {}),
      ...(query.data.assigneeId
        ? { assigneeId: query.data.assigneeId === 'unassigned' ? null : query.data.assigneeId }
        : {}),
      ...(query.data.search
        ? {
            OR: [
              { title: { contains: query.data.search, mode: 'insensitive' as const } },
              { description: { contains: query.data.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(query.data.dueBefore || query.data.dueAfter
        ? {
            dueAt: {
              ...(query.data.dueBefore ? { lte: new Date(query.data.dueBefore) } : {}),
              ...(query.data.dueAfter ? { gte: new Date(query.data.dueAfter) } : {}),
            },
          }
        : {}),
    };
    const { items, total } = await repo.list(projectId, where, skip, take);
    return paginated(items, total, page, pageSize);
  },
  async create(projectId: string, actor: Actor, input: Zod.infer<typeof taskCreateSchema>) {
    await assertProjectAccess(projectId, actor, 'write');
    if (input.assigneeId && !(await repo.userIsWorkspaceMember(projectId, input.assigneeId)))
      throw new HttpError(400, 'INVALID_ASSIGNEE', 'Assignee must belong to this workspace');
    if (input.parentId && !(await repo.parentBelongsToProject(input.parentId, projectId)))
      throw new HttpError(400, 'INVALID_PARENT', 'Parent task must belong to this project');
    return repo.create(
      projectId,
      actor.userId,
      omitUndefined({
        ...input,
        completedAt: input.status === 'DONE' ? new Date() : null,
      }) as Parameters<typeof repo.create>[2],
    );
  },
  async get(taskId: string, actor: Actor) {
    return taskForActor(taskId, actor, 'read');
  },
  async update(taskId: string, actor: Actor, input: Zod.infer<typeof taskUpdateSchema>) {
    const task = await taskForActor(taskId, actor, 'write');
    const startAt = input.startAt === undefined ? task.startAt : input.startAt;
    const dueAt = input.dueAt === undefined ? task.dueAt : input.dueAt;
    if (startAt && dueAt && startAt > dueAt)
      throw new HttpError(400, 'INVALID_DATES', 'Start date must be before or equal to due date');
    if (input.assigneeId && !(await repo.userIsWorkspaceMember(task.projectId, input.assigneeId)))
      throw new HttpError(400, 'INVALID_ASSIGNEE', 'Assignee must belong to this workspace');
    if (input.parentId && !(await repo.parentBelongsToProject(input.parentId, task.projectId)))
      throw new HttpError(400, 'INVALID_PARENT', 'Parent task must belong to this project');
    return repo.update(
      taskId,
      actor.userId,
      omitUndefined({
        ...input,
        ...(input.status ? { completedAt: input.status === 'DONE' ? new Date() : null } : {}),
      }) as Parameters<typeof repo.update>[2],
      'task.updated',
    );
  },
  async updateStatus(
    taskId: string,
    actor: Actor,
    status: Zod.infer<typeof taskStatusSchema>['status'],
  ) {
    await taskForActor(taskId, actor, 'write');
    return repo.update(
      taskId,
      actor.userId,
      { status, completedAt: status === 'DONE' ? new Date() : null },
      'task.status_changed',
    );
  },
  async assign(
    taskId: string,
    actor: Actor,
    assigneeId: Zod.infer<typeof taskAssigneeSchema>['assigneeId'],
  ) {
    const task = await taskForActor(taskId, actor, 'write');
    if (assigneeId && !(await repo.userIsWorkspaceMember(task.projectId, assigneeId)))
      throw new HttpError(400, 'INVALID_ASSIGNEE', 'Assignee must belong to this workspace');
    return repo.update(taskId, actor.userId, { assigneeId }, 'task.assigned');
  },
  async remove(taskId: string, actor: Actor) {
    await taskForActor(taskId, actor, 'admin');
    await repo.remove(taskId, actor.userId);
  },
  async comments(taskId: string, actor: Actor, query: Record<string, unknown>) {
    await taskForActor(taskId, actor, 'read');
    const { page, pageSize, skip, take } = parsePage(query);
    const { items, total } = await repo.comments(taskId, skip, take);
    return paginated(items, total, page, pageSize);
  },
  async addComment(taskId: string, actor: Actor, input: Zod.infer<typeof taskCommentSchema>) {
    await taskForActor(taskId, actor, 'write');
    return repo.addComment(taskId, actor.userId, input.content);
  },
  async dependencies(taskId: string, actor: Actor) {
    await taskForActor(taskId, actor, 'read');
    return repo.dependencies(taskId);
  },
  async addDependency(taskId: string, actor: Actor, input: Zod.infer<typeof taskDependencySchema>) {
    await taskForActor(taskId, actor, 'write');
    await taskForActor(input.dependsOnId, actor, 'read');
    return repo.addDependency(taskId, input.dependsOnId, actor.userId);
  },
  async removeDependency(taskId: string, dependsOnId: string, actor: Actor) {
    await taskForActor(taskId, actor, 'write');
    await taskForActor(dependsOnId, actor, 'read');
    await repo.removeDependency(taskId, dependsOnId, actor.userId);
  },
};
