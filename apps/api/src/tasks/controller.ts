import type { RequestHandler } from 'express';
import { HttpError } from '../core/http.js';
import type { AuthLocals } from '../auth/middleware.js';
import { taskService } from './service.js';
import {
  taskAssigneeSchema,
  taskCommentSchema,
  taskCreateSchema,
  taskDependencySchema,
  taskStatusSchema,
  taskUpdateSchema,
} from './schemas.js';

function actor(response: Parameters<RequestHandler>[1]) {
  const auth = (response.locals as AuthLocals).auth;
  if (!auth) throw new HttpError(401, 'UNAUTHENTICATED', 'Sign in required');
  return auth;
}
function param(value: string | string[] | undefined, label: string) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 191)
    throw new HttpError(400, 'INVALID_REQUEST', `Invalid ${label}`);
  return value;
}
function parsed<T>(
  schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } },
  body: unknown,
): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new HttpError(400, 'INVALID_REQUEST', 'Invalid request body');
  return result.data;
}

export const taskController = {
  list: (async (request, response) => {
    response
      .status(200)
      .json(
        await taskService.list(
          param(request.params.projectId, 'project id'),
          actor(response),
          request.query,
        ),
      );
  }) satisfies RequestHandler,
  create: (async (request, response) => {
    const task = await taskService.create(
      param(request.params.projectId, 'project id'),
      actor(response),
      parsed(taskCreateSchema, request.body),
    );
    response.status(201).json({ task });
  }) satisfies RequestHandler,
  get: (async (request, response) => {
    response.status(200).json({
      task: await taskService.get(param(request.params.taskId, 'task id'), actor(response)),
    });
  }) satisfies RequestHandler,
  update: (async (request, response) => {
    const task = await taskService.update(
      param(request.params.taskId, 'task id'),
      actor(response),
      parsed(taskUpdateSchema, request.body),
    );
    response.status(200).json({ task });
  }) satisfies RequestHandler,
  status: (async (request, response) => {
    const body = parsed(taskStatusSchema, request.body);
    const task = await taskService.updateStatus(
      param(request.params.taskId, 'task id'),
      actor(response),
      body.status,
    );
    response.status(200).json({ task });
  }) satisfies RequestHandler,
  assign: (async (request, response) => {
    const body = parsed(taskAssigneeSchema, request.body);
    const task = await taskService.assign(
      param(request.params.taskId, 'task id'),
      actor(response),
      body.assigneeId,
    );
    response.status(200).json({ task });
  }) satisfies RequestHandler,
  remove: (async (request, response) => {
    await taskService.remove(param(request.params.taskId, 'task id'), actor(response));
    response.status(204).end();
  }) satisfies RequestHandler,
  comments: (async (request, response) => {
    response
      .status(200)
      .json(
        await taskService.comments(
          param(request.params.taskId, 'task id'),
          actor(response),
          request.query,
        ),
      );
  }) satisfies RequestHandler,
  addComment: (async (request, response) => {
    const comment = await taskService.addComment(
      param(request.params.taskId, 'task id'),
      actor(response),
      parsed(taskCommentSchema, request.body),
    );
    response.status(201).json({ comment });
  }) satisfies RequestHandler,
  dependencies: (async (request, response) => {
    const items = await taskService.dependencies(
      param(request.params.taskId, 'task id'),
      actor(response),
    );
    response.status(200).json({ items });
  }) satisfies RequestHandler,
  addDependency: (async (request, response) => {
    const dependency = await taskService.addDependency(
      param(request.params.taskId, 'task id'),
      actor(response),
      parsed(taskDependencySchema, request.body),
    );
    response.status(201).json({ dependency });
  }) satisfies RequestHandler,
  removeDependency: (async (request, response) => {
    await taskService.removeDependency(
      param(request.params.taskId, 'task id'),
      param(request.params.dependsOnId, 'dependency task id'),
      actor(response),
    );
    response.status(204).end();
  }) satisfies RequestHandler,
};
