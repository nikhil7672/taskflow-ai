import { Router } from 'express';
import { requireAuth, requireTrustedOrigin } from '../auth/middleware.js';
import { projectController as controller } from './controller.js';

const projectRouter = Router();

projectRouter.get('/workspaces/:workspaceId/projects', requireAuth, controller.list);
projectRouter.post(
  '/workspaces/:workspaceId/projects',
  requireAuth,
  requireTrustedOrigin,
  controller.create,
);
projectRouter.get('/projects/:projectId', requireAuth, controller.get);
projectRouter.patch('/projects/:projectId', requireAuth, requireTrustedOrigin, controller.update);
projectRouter.post(
  '/projects/:projectId/archive',
  requireAuth,
  requireTrustedOrigin,
  controller.archive,
);
projectRouter.delete('/projects/:projectId', requireAuth, requireTrustedOrigin, controller.remove);
projectRouter.get('/projects/:projectId/members', requireAuth, controller.listMembers);
projectRouter.post(
  '/projects/:projectId/members',
  requireAuth,
  requireTrustedOrigin,
  controller.addMember,
);
projectRouter.delete(
  '/projects/:projectId/members/:userId',
  requireAuth,
  requireTrustedOrigin,
  controller.removeMember,
);

export { projectRouter };
