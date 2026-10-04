import type { RequestHandler } from 'express';
import { prisma } from '@taskflow/database';
import { hasWorkspaceRole, type WorkspaceRole } from './access-control.js';
import {
  clearSessionCookieOptions,
  hashToken,
  isTrustedBrowserOrigin,
  readSessionCookie,
  SESSION_COOKIE_NAME,
} from './security.js';

export type AuthLocals = {
  auth?: { userId: string; sessionId: string };
  workspaceRole?: WorkspaceRole;
};

export const requireAuth: RequestHandler = async (request, response, next) => {
  const token = readSessionCookie(request.headers.cookie);
  if (!token) {
    response.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in required' } });
    return;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    response.clearCookie(SESSION_COOKIE_NAME, clearSessionCookieOptions());
    response.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in required' } });
    return;
  }

  (response.locals as AuthLocals).auth = { userId: session.userId, sessionId: session.id };
  next();
};

export function requireWorkspaceRole(
  ...allowedRoles: WorkspaceRole[]
): RequestHandler<{ workspaceId: string }> {
  return async (request, response, next) => {
    const auth = (response.locals as AuthLocals).auth;
    if (!auth) {
      response
        .status(401)
        .json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in required' } });
      return;
    }

    const workspaceId = request.params.workspaceId;
    if (typeof workspaceId !== 'string') {
      response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Workspace not found' } });
      return;
    }
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: auth.userId },
      },
      select: { role: true },
    });

    if (!membership) {
      response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Workspace not found' } });
      return;
    }
    if (!hasWorkspaceRole(membership.role, allowedRoles)) {
      response
        .status(403)
        .json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
      return;
    }

    (response.locals as AuthLocals).workspaceRole = membership.role;
    next();
  };
}

export const requireTrustedOrigin: RequestHandler = (request, response, next) => {
  if (!isTrustedBrowserOrigin(request.headers.origin)) {
    response
      .status(403)
      .json({ error: { code: 'FORBIDDEN', message: 'Request origin not allowed' } });
    return;
  }
  next();
};
