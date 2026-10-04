import { Router } from 'express';
import { requireAuth, requireTrustedOrigin } from '../auth/middleware.js';
import { taskController as controller } from './controller.js';

const taskRouter = Router();

taskRouter.get('/projects/:projectId/tasks', requireAuth, controller.list);
taskRouter.post('/projects/:projectId/tasks', requireAuth, requireTrustedOrigin, controller.create);
taskRouter.get('/tasks/:taskId', requireAuth, controller.get);
taskRouter.patch('/tasks/:taskId', requireAuth, requireTrustedOrigin, controller.update);
taskRouter.patch('/tasks/:taskId/status', requireAuth, requireTrustedOrigin, controller.status);
taskRouter.put('/tasks/:taskId/assignee', requireAuth, requireTrustedOrigin, controller.assign);
taskRouter.delete('/tasks/:taskId', requireAuth, requireTrustedOrigin, controller.remove);
taskRouter.get('/tasks/:taskId/comments', requireAuth, controller.comments);
taskRouter.post(
  '/tasks/:taskId/comments',
  requireAuth,
  requireTrustedOrigin,
  controller.addComment,
);
taskRouter.get('/tasks/:taskId/dependencies', requireAuth, controller.dependencies);
taskRouter.post(
  '/tasks/:taskId/dependencies',
  requireAuth,
  requireTrustedOrigin,
  controller.addDependency,
);
taskRouter.delete(
  '/tasks/:taskId/dependencies/:dependsOnId',
  requireAuth,
  requireTrustedOrigin,
  controller.removeDependency,
);

export { taskRouter };
