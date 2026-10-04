import type { RequestHandler } from 'express';
import { HttpError } from '../core/http.js';
import type { AuthLocals } from '../auth/middleware.js';
import { workspaceOverviewService } from './overview-service.js';

export const workspaceOverviewController: RequestHandler = async (request, response) => {
  const auth = (response.locals as AuthLocals).auth;
  if (!auth) throw new HttpError(401, 'UNAUTHENTICATED', 'Sign in required');
  const workspaceId = request.params.workspaceId;
  if (typeof workspaceId !== 'string')
    throw new HttpError(400, 'INVALID_REQUEST', 'Invalid workspace id');
  response.status(200).json(await workspaceOverviewService.get(workspaceId, auth));
};
