import { notFound } from 'next/navigation';
import { ApiErrorPanel } from '@/components/shared/api-error-panel';
import { ProjectDetailsView } from '@/components/projects/project-details-view';
import { getAuthenticatedUser } from '@/lib/auth';
import { ApiError } from '@/lib/api-client';
import type { ApiProject, ApiProjectActivity, ApiTask, ApiWorkspaceMember } from '@/lib/api-types';
import { captureServerApiResult, serverApiRequest } from '@/lib/server-api';

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await getAuthenticatedUser();
  if (!user) return <ApiErrorPanel message="Sign in to view this project." />;

  const result = await captureServerApiResult(
    Promise.all([
      serverApiRequest<{ project: ApiProject }>(`/projects/${encodeURIComponent(projectId)}`),
      serverApiRequest<{ items: ApiTask[] }>(
        `/projects/${encodeURIComponent(projectId)}/tasks?pageSize=100`,
      ),
    ]).then(([projectResult, taskResponse]) => ({
      project: projectResult.project,
      tasks: taskResponse.items,
    })),
  );
  if ('error' in result) {
    if (result.error instanceof ApiError && result.error.status === 404) notFound();
    return (
      <ApiErrorPanel
        message={
          result.error instanceof ApiError
            ? result.error.message
            : 'Project details could not be loaded.'
        }
      />
    );
  }
  const { project, tasks } = result.data;
  const workspaceRole = user.memberships.find(
    (membership) => membership.workspace.id === project.workspaceId,
  )?.role;
  const isWorkspaceAdmin = workspaceRole === 'OWNER' || workspaceRole === 'ADMIN';
  const isProjectAdmin =
    project.members?.some((member) => member.user.id === user.id && member.role === 'ADMIN') ??
    false;
  const canManage = isWorkspaceAdmin || isProjectAdmin;
  const [activityResult, workspaceMembersResult] = await Promise.allSettled([
    serverApiRequest<{ items: ApiProjectActivity[] }>(
      `/projects/${encodeURIComponent(project.id)}/activity?pageSize=50`,
    ),
    canManage
      ? serverApiRequest<{ items: ApiWorkspaceMember[] }>(
          `/workspaces/${encodeURIComponent(project.workspaceId)}/members?pageSize=100`,
        )
      : Promise.resolve({ items: [] as ApiWorkspaceMember[] }),
  ]);
  return (
    <ProjectDetailsView
      initialProject={project}
      tasks={tasks}
      canManage={canManage}
      workspaceMembers={
        workspaceMembersResult.status === 'fulfilled' ? workspaceMembersResult.value.items : []
      }
      activity={activityResult.status === 'fulfilled' ? activityResult.value.items : []}
      activityFailed={activityResult.status === 'rejected'}
    />
  );
}
