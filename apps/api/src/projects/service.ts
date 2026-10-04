import { HttpError, omitUndefined, paginated, parsePage } from '../core/http.js';
import type { AuthLocals } from '../auth/middleware.js';
import { projectRepository as repo } from './repository.js';
import type { z } from 'zod';
import {
  projectCreateSchema,
  projectListQuerySchema,
  projectMemberSchema,
  projectUpdateSchema,
} from './schemas.js';
import { decideProjectAccess } from './policy.js';

type Actor = NonNullable<AuthLocals['auth']>;
type ProjectInput = z.infer<typeof projectCreateSchema>;
type ProjectUpdate = z.infer<typeof projectUpdateSchema>;

export async function assertProjectAccess(
  projectId: string,
  actor: Actor,
  level: 'read' | 'write' | 'admin',
) {
  const project = await repo.getProject(projectId);
  if (!project) throw new HttpError(404, 'NOT_FOUND', 'Project not found');
  const [workspaceMembership, projectMembership] = await Promise.all([
    repo.workspaceRole(project.workspaceId, actor.userId),
    repo.projectRole(project.id, actor.userId),
  ]);
  const decision = decideProjectAccess(
    workspaceMembership?.role ?? null,
    projectMembership?.role ?? null,
    level,
  );
  if (decision === 'not_found') throw new HttpError(404, 'NOT_FOUND', 'Project not found');
  if (decision === 'forbidden') throw new HttpError(403, 'FORBIDDEN', 'Insufficient permissions');
  const workspaceAdmin =
    workspaceMembership?.role === 'OWNER' || workspaceMembership?.role === 'ADMIN';
  return { project, workspaceAdmin };
}

export const projectService = {
  async list(workspaceId: string, actor: Actor, query: Record<string, unknown>) {
    const membership = await repo.workspaceRole(workspaceId, actor.userId);
    if (!membership) throw new HttpError(404, 'NOT_FOUND', 'Workspace not found');
    const parsed = projectListQuerySchema.safeParse(query);
    if (!parsed.success) throw new HttpError(400, 'INVALID_REQUEST', 'Invalid project filters');
    const { page, pageSize, skip, take } = parsePage(parsed.data);
    const search = parsed.data.search;
    const { items, total } = await repo.list(
      workspaceId,
      actor.userId,
      ['OWNER', 'ADMIN'].includes(membership.role),
      skip,
      take,
      search,
    );
    return paginated(items, total, page, pageSize);
  },
  async create(workspaceId: string, actor: Actor, input: ProjectInput) {
    const membership = await repo.workspaceRole(workspaceId, actor.userId);
    if (!membership) throw new HttpError(404, 'NOT_FOUND', 'Workspace not found');
    if (membership.role === 'GUEST')
      throw new HttpError(403, 'FORBIDDEN', 'Insufficient permissions');
    return repo.create(
      omitUndefined({ ...input, workspaceId, createdById: actor.userId }) as Parameters<
        typeof repo.create
      >[0],
    );
  },
  async get(projectId: string, actor: Actor) {
    const { project } = await assertProjectAccess(projectId, actor, 'read');
    const members = await repo.listMembers(projectId);
    return { ...project, members };
  },
  async listMembers(projectId: string, actor: Actor) {
    await assertProjectAccess(projectId, actor, 'read');
    return repo.listMembers(projectId);
  },
  async update(projectId: string, actor: Actor, input: ProjectUpdate) {
    await assertProjectAccess(projectId, actor, 'admin');
    return repo.update(
      projectId,
      omitUndefined(input) as Parameters<typeof repo.update>[1],
      actor.userId,
      'project.updated',
    );
  },
  async archive(projectId: string, actor: Actor) {
    await assertProjectAccess(projectId, actor, 'admin');
    return repo.update(
      projectId,
      { status: 'ARCHIVED', archivedAt: new Date() },
      actor.userId,
      'project.archived',
    );
  },
  async remove(projectId: string, actor: Actor) {
    await assertProjectAccess(projectId, actor, 'admin');
    await repo.delete(projectId, actor.userId);
  },
  async addMember(projectId: string, actor: Actor, input: z.infer<typeof projectMemberSchema>) {
    const { project } = await assertProjectAccess(projectId, actor, 'admin');
    if (!(await repo.memberIsWorkspaceMember(project.workspaceId, input.userId)))
      throw new HttpError(400, 'INVALID_MEMBER', 'User must belong to this workspace');
    const existingRole = await repo.projectRole(projectId, input.userId);
    if (
      existingRole?.role === 'ADMIN' &&
      input.role !== 'ADMIN' &&
      (await repo.countProjectAdmins(projectId)) <= 1
    ) {
      throw new HttpError(
        409,
        'LAST_PROJECT_ADMIN',
        'A project must retain at least one administrator',
      );
    }
    return repo.addMember(projectId, input.userId, input.role, actor.userId);
  },
  async removeMember(projectId: string, actor: Actor, userId: string) {
    await assertProjectAccess(projectId, actor, 'admin');
    const member = await repo.projectRole(projectId, userId);
    if (!member) throw new HttpError(404, 'NOT_FOUND', 'Project member not found');
    if (member.role === 'ADMIN' && (await repo.countProjectAdmins(projectId)) <= 1) {
      throw new HttpError(
        409,
        'LAST_PROJECT_ADMIN',
        'A project must retain at least one administrator',
      );
    }
    await repo.removeMember(projectId, userId, actor.userId);
  },
};
