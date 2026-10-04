export const WORKSPACE_ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export function hasWorkspaceRole(
  actualRole: WorkspaceRole | undefined,
  allowedRoles: readonly WorkspaceRole[],
): boolean {
  return actualRole !== undefined && allowedRoles.includes(actualRole);
}
