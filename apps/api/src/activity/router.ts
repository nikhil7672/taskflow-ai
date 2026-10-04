import { Router } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { activityController, projectActivityController } from './controller.js';

const activityRouter = Router();
activityRouter.get('/workspaces/:workspaceId/activity', requireAuth, activityController);
activityRouter.get('/projects/:projectId/activity', requireAuth, projectActivityController);
export { activityRouter };
