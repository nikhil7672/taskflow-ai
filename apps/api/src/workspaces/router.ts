import { Router } from 'express';
import { prisma } from '@taskflow/database';
import {
  requireAuth,
  requireTrustedOrigin,
  requireWorkspaceRole,
  type AuthLocals,
} from '../auth/middleware.js';
import { workspaceUpdateSchema } from '../auth/security.js';
import { workspaceMemberController } from './members-controller.js';
import { workspaceOverviewController } from './overview-controller.js';

const workspaceRouter = Router();

workspaceRouter.get('/:workspaceId/overview', requireAuth, workspaceOverviewController);
workspaceRouter.get('/:workspaceId/members', requireAuth, workspaceMemberController.list);
workspaceRouter.patch(
  '/:workspaceId/members/:userId',
  requireAuth,
  requireTrustedOrigin,
  workspaceMemberController.changeRole,
);
workspaceRouter.delete(
  '/:workspaceId/members/:userId',
  requireAuth,
  requireTrustedOrigin,
  workspaceMemberController.remove,
);

workspaceRouter.get('/:workspaceId', requireAuth, async (request, response) => {
  const auth = (response.locals as AuthLocals).auth;
  if (!auth) return;
  const workspaceId = request.params.workspaceId;
  if (typeof workspaceId !== 'string') {
    response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Workspace not found' } });
    return;
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: auth.userId },
    },
    select: {
      role: true,
      workspace: { select: { id: true, name: true, slug: true, createdAt: true } },
    },
  });
  if (!membership) {
    response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Workspace not found' } });
    return;
  }
  response.status(200).json({ workspace: membership.workspace, role: membership.role });
});

workspaceRouter.patch(
  '/:workspaceId',
  requireAuth,
  requireTrustedOrigin,
  requireWorkspaceRole('OWNER', 'ADMIN'),
  async (request, response) => {
    const parsed = workspaceUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      response
        .status(400)
        .json({ error: { code: 'INVALID_REQUEST', message: 'Enter a valid workspace name' } });
      return;
    }
    const workspaceId = request.params.workspaceId;
    if (typeof workspaceId !== 'string') {
      response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Workspace not found' } });
      return;
    }
    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: parsed.data.name },
      select: { id: true, name: true, slug: true, updatedAt: true },
    });
    response.status(200).json({ workspace });
  },
);

export { workspaceRouter };
