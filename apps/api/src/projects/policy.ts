export type ProjectAccessLevel = 'read' | 'write' | 'admin';
export type ProjectAccessDecision = 'allow' | 'not_found' | 'forbidden';
export type WorkspaceMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
export type ProjectMemberRole = 'ADMIN' | 'MEMBER' | 'VIEWER';

export function decideProjectAccess(
  workspaceRole: WorkspaceMemberRole | null,
  projectRole: ProjectMemberRole | null,
  level: ProjectAccessLevel,
): ProjectAccessDecision {
  if (!workspaceRole) return 'not_found';
  const workspaceAdmin = workspaceRole === 'OWNER' || workspaceRole === 'ADMIN';
  if (level === 'read') return workspaceAdmin || projectRole ? 'allow' : 'not_found';
  if (level === 'write')
    return workspaceAdmin || projectRole === 'ADMIN' || projectRole === 'MEMBER'
      ? 'allow'
      : 'forbidden';
  return workspaceAdmin || projectRole === 'ADMIN' ? 'allow' : 'forbidden';
}
