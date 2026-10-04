import { FolderKanban } from 'lucide-react';
import { ProjectsView } from '@/components/projects/projects-view';
import { PageHeading } from '@/components/shared/page-heading';
import { getCurrentWorkspace } from '@/lib/auth';
import { serverApiRequest } from '@/lib/server-api';
import type { ApiOverview } from '@/lib/api-types';
import { ApiErrorPanel } from '@/components/shared/api-error-panel';
import { ApiError } from '@/lib/api-client';

export default async function ProjectsPage() {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return <ApiErrorPanel message="Your account does not have a workspace yet." />;
  let overview: ApiOverview;
  try {
    overview = await serverApiRequest<ApiOverview>(
      `/workspaces/${encodeURIComponent(workspace.id)}/overview`,
    );
  } catch (error) {
    return (
      <ApiErrorPanel
        message={error instanceof ApiError ? error.message : 'Projects could not be loaded.'}
      />
    );
  }

  return (
    <div>
      <PageHeading
        eyebrow="Workspace"
        title="Projects"
        description="Keep every initiative organized, visible, and moving forward."
      />
      <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <FolderKanban size={15} aria-hidden="true" />
        <span>
          <strong className="font-semibold text-foreground">
            {overview.stats.projectCount} projects
          </strong>{' '}
          across your workspace
        </span>
      </div>
      <ProjectsView
        key={workspace.id}
        workspaceId={workspace.id}
        initialProjects={overview.projects}
      />
    </div>
  );
}
