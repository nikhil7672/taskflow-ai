import { HttpError } from '../core/http.js';
import type { AuthLocals } from '../auth/middleware.js';
import { workspaceOverviewRepository } from './overview-repository.js';

type Actor = NonNullable<AuthLocals['auth']>;

export const workspaceOverviewService = {
  async get(workspaceId: string, actor: Actor) {
    const membership = await workspaceOverviewRepository.role(workspaceId, actor.userId);
    if (!membership) throw new HttpError(404, 'NOT_FOUND', 'Workspace not found');
    const admin = membership.role === 'OWNER' || membership.role === 'ADMIN';
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return workspaceOverviewRepository.get(workspaceId, actor.userId, admin, monthStart);
  },
};
