import { TeamView } from '@/components/team/team-view';
import { getAuthenticatedUser, getCurrentWorkspace } from '@/lib/auth';
import { captureServerApiResult, serverApiRequest } from '@/lib/server-api';
import type { ApiWorkspaceMember } from '@/lib/api-types';
import { ApiErrorPanel } from '@/components/shared/api-error-panel';

export default async function TeamPage() {
  const [user, workspace] = await Promise.all([getAuthenticatedUser(), getCurrentWorkspace()]);
  if (!user || !workspace) return <ApiErrorPanel message="Your workspace could not be loaded." />;
  const membership = user.memberships.find((item) => item.workspace.id === workspace.id);
  if (!membership)
    return <ApiErrorPanel message="Your account is not a member of this workspace." />;
  const response = await captureServerApiResult(
    serverApiRequest<{
      items: ApiWorkspaceMember[];
      pagination: { total: number };
    }>(`/workspaces/${encodeURIComponent(workspace.id)}/members?pageSize=100`),
  );
  if ('error' in response)
    return <ApiErrorPanel message="Workspace members could not be loaded." />;
  const result = response.data;
  return (
    <TeamView
      key={workspace.id}
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      initialMembers={result.items}
      totalMembers={result.pagination.total}
      actorRole={membership.role}
    />
  );
}
