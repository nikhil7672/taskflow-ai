import type { RequestHandler } from 'express';
import { HttpError } from '../core/http.js';
import type { AuthLocals } from '../auth/middleware.js';
import { isWorkspaceRole, workspaceMemberService } from './members-service.js';

function actor(response: Parameters<RequestHandler>[1]) {
  const auth = (response.locals as AuthLocals).auth;
  if (!auth) throw new HttpError(401, 'UNAUTHENTICATED', 'Sign in required');
  return auth;
}
function id(value: string | string[] | undefined) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 191)
    throw new HttpError(400, 'INVALID_REQUEST', 'Invalid identifier');
  return value;
}

export const workspaceMemberController = {
  list: (async (request, response) => {
    response
      .status(200)
      .json(
        await workspaceMemberService.list(
          id(request.params.workspaceId),
          actor(response),
          request.query,
        ),
      );
  }) satisfies RequestHandler,
  changeRole: (async (request, response) => {
    if (!isWorkspaceRole(request.body?.role))
      throw new HttpError(400, 'INVALID_REQUEST', 'Invalid workspace role');
    const member = await workspaceMemberService.changeRole(
      id(request.params.workspaceId),
      id(request.params.userId),
      actor(response),
      request.body.role,
    );
    response.status(200).json({ member });
  }) satisfies RequestHandler,
  remove: (async (request, response) => {
    await workspaceMemberService.remove(
      id(request.params.workspaceId),
      id(request.params.userId),
      actor(response),
    );
    response.status(204).end();
  }) satisfies RequestHandler,
};
