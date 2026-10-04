import { HttpError, paginated, parsePage } from '../core/http.js';
import type { AuthLocals } from '../auth/middleware.js';
import { activityRepository } from './repository.js';
import { assertProjectAccess } from '../projects/service.js';

type Actor = NonNullable<AuthLocals['auth']>;

export const activityService = {
  async list(workspaceId: string, actor: Actor, query: Record<string, unknown>) {
    const membership = await activityRepository.workspaceRole(workspaceId, actor.userId);
    if (!membership) throw new HttpError(404, 'NOT_FOUND', 'Workspace not found');
    const { page, pageSize, skip, take } = parsePage(query);
    const isAdmin = membership.role === 'OWNER' || membership.role === 'ADMIN';
    const projectAccess = isAdmin
      ? {}
      : { OR: [{ projectId: null }, { project: { members: { some: { userId: actor.userId } } } }] };
    const { items, total } = await activityRepository.list(
      { workspaceId, ...projectAccess },
      skip,
      take,
    );
    return paginated(items, total, page, pageSize);
  },
  async project(projectId: string, actor: Actor, query: Record<string, unknown>) {
    await assertProjectAccess(projectId, actor, 'read');
    const { page, pageSize, skip, take } = parsePage(query);
    const { items, total } = await activityRepository.list({ projectId }, skip, take);
    return paginated(items, total, page, pageSize);
  },
};
