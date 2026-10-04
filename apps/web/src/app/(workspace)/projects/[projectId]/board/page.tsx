import { ArrowLeft, CalendarDays, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BoardView } from '@/components/board/board-view';
import { ApiErrorPanel } from '@/components/shared/api-error-panel';
import { PageHeading } from '@/components/shared/page-heading';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { getAuthenticatedUser } from '@/lib/auth';
import type { ApiProject, ApiTask } from '@/lib/api-types';
import { captureServerApiResult, serverApiRequest } from '@/lib/server-api';

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await getAuthenticatedUser();
  if (!user) return <ApiErrorPanel message="Sign in to view this board." />;

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
            : 'The task board could not be loaded.'
        }
      />
    );
  }
  const { project, tasks } = result.data;
  const workspaceRole = user.memberships.find(
    (membership) => membership.workspace.id === project.workspaceId,
  )?.role;
  const projectRole = project.members?.find((member) => member.user.id === user.id)?.role;
  const canWrite =
    ['OWNER', 'ADMIN'].includes(workspaceRole ?? '') ||
    ['ADMIN', 'MEMBER'].includes(projectRole ?? '');
  const canDelete = ['OWNER', 'ADMIN'].includes(workspaceRole ?? '') || projectRole === 'ADMIN';

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {project.name}
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 rounded-lg text-xs sm:inline-flex"
        >
          <CalendarDays size={14} aria-hidden="true" /> Timeline
        </Button>
      </div>
      <PageHeading
        eyebrow="Project board"
        title="Tasks"
        description="A shared view of planned, active, and completed work."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            <LayoutGrid size={14} aria-hidden="true" /> Board view
          </span>
        }
      />
      <BoardView project={project} initialTasks={tasks} canWrite={canWrite} canDelete={canDelete} />
    </div>
  );
}
