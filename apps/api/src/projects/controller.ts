import type { RequestHandler } from 'express';
import { HttpError } from '../core/http.js';
import type { AuthLocals } from '../auth/middleware.js';
import { projectService } from './service.js';
import { projectCreateSchema, projectMemberSchema, projectUpdateSchema } from './schemas.js';

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

export const projectController = {
  list: (async (request, response) => {
    const result = await projectService.list(
      param(request.params.workspaceId, 'workspace id'),
      actor(response),
      request.query,
    );
    response.status(200).json(result);
  }) satisfies RequestHandler,
  create: (async (request, response) => {
    const project = await projectService.create(
      param(request.params.workspaceId, 'workspace id'),
      actor(response),
      parsed(projectCreateSchema, request.body),
    );
    response.status(201).json({ project });
  }) satisfies RequestHandler,
  get: (async (request, response) => {
    response.status(200).json({
      project: await projectService.get(
        param(request.params.projectId, 'project id'),
        actor(response),
      ),
    });
  }) satisfies RequestHandler,
  listMembers: (async (request, response) => {
    response.status(200).json({
      members: await projectService.listMembers(
        param(request.params.projectId, 'project id'),
        actor(response),
      ),
    });
  }) satisfies RequestHandler,
  update: (async (request, response) => {
    const project = await projectService.update(
      param(request.params.projectId, 'project id'),
      actor(response),
      parsed(projectUpdateSchema, request.body),
    );
    response.status(200).json({ project });
  }) satisfies RequestHandler,
  archive: (async (request, response) => {
    const project = await projectService.archive(
      param(request.params.projectId, 'project id'),
      actor(response),
    );
    response.status(200).json({ project });
  }) satisfies RequestHandler,
  remove: (async (request, response) => {
    await projectService.remove(param(request.params.projectId, 'project id'), actor(response));
    response.status(204).end();
  }) satisfies RequestHandler,
  addMember: (async (request, response) => {
    const member = await projectService.addMember(
      param(request.params.projectId, 'project id'),
      actor(response),
      parsed(projectMemberSchema, request.body),
    );
    response.status(201).json({ member });
  }) satisfies RequestHandler,
  removeMember: (async (request, response) => {
    await projectService.removeMember(
      param(request.params.projectId, 'project id'),
      actor(response),
      param(request.params.userId, 'user id'),
    );
    response.status(204).end();
  }) satisfies RequestHandler,
};
