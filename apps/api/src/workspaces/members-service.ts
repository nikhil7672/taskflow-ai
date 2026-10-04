import { HttpError, paginated, parsePage } from '../core/http.js';
import type { AuthLocals } from '../auth/middleware.js';
import { workspaceMemberRepository as repo } from './members-repository.js';

type Actor = NonNullable<AuthLocals['auth']>;
const assignableRoles = ['ADMIN', 'MEMBER', 'GUEST'] as const;
export type AssignableWorkspaceRole = (typeof assignableRoles)[number];

async function authorize(workspaceId: string, actor: Actor, ownerOnly = false) {
  const membership = await repo.role(workspaceId, actor.userId);
  if (!membership) throw new HttpError(404, 'NOT_FOUND', 'Workspace not found');
  if (ownerOnly ? membership.role !== 'OWNER' : !['OWNER', 'ADMIN'].includes(membership.role)) {
    throw new HttpError(403, 'FORBIDDEN', 'Insufficient permissions');
  }
  return membership;
}

export const workspaceMemberService = {
  async list(workspaceId: string, actor: Actor, query: Record<string, unknown>) {
    if (!(await repo.role(workspaceId, actor.userId)))
      throw new HttpError(404, 'NOT_FOUND', 'Workspace not found');
    const { page, pageSize, skip, take } = parsePage(query);
    const { items, total } = await repo.list(workspaceId, skip, take);
    return paginated(items, total, page, pageSize);
  },
  async changeRole(
    workspaceId: string,
    userId: string,
    actor: Actor,
    role: AssignableWorkspaceRole,
  ) {
    const actorMembership = await authorize(workspaceId, actor, role === 'ADMIN');
    const target = await repo.memberRole(workspaceId, userId);
    if (!target) throw new HttpError(404, 'NOT_FOUND', 'Workspace member not found');
    if (target.role === 'OWNER') {
      throw new HttpError(
        409,
        'OWNER_TRANSFER_REQUIRED',
        'Workspace ownership must be transferred separately',
      );
    }
    if (target.role === 'ADMIN' && actorMembership.role !== 'OWNER') {
      throw new HttpError(403, 'FORBIDDEN', 'Only the owner can change an administrator role');
    }
    return repo.changeRole(workspaceId, userId, actor.userId, target.role, role);
  },
  async remove(workspaceId: string, userId: string, actor: Actor) {
    await authorize(workspaceId, actor);
    const target = await repo.memberRole(workspaceId, userId);
    if (!target) throw new HttpError(404, 'NOT_FOUND', 'Workspace member not found');
    if (target.role === 'OWNER') {
      throw new HttpError(
        409,
        'OWNER_TRANSFER_REQUIRED',
        'Workspace ownership must be transferred separately',
      );
    }
    if (target.role === 'ADMIN') await authorize(workspaceId, actor, true);
    await repo.remove(workspaceId, userId, actor.userId);
  },
};

export function isWorkspaceRole(value: unknown): value is AssignableWorkspaceRole {
  return typeof value === 'string' && assignableRoles.includes(value as AssignableWorkspaceRole);
}
