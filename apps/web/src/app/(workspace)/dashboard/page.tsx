import { ArrowRight, CheckCircle2, Clock3, FolderKanban, Plus, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { ActivityList } from '@/components/dashboard/activity-list';
import { ProgressChart } from '@/components/dashboard/progress-chart';
import { ProjectCard } from '@/components/projects/project-card';
import { ApiErrorPanel } from '@/components/shared/api-error-panel';
import { PageHeading } from '@/components/shared/page-heading';
import { StatCard } from '@/components/shared/stat-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError } from '@/lib/api-client';
import type { ApiOverview } from '@/lib/api-types';
import { getAuthenticatedUser, getCurrentWorkspace } from '@/lib/auth';
import { formatDate, initials } from '@/lib/format';
import { serverApiRequest } from '@/lib/server-api';
export default async function DashboardPage() {
  const [user, workspace] = await Promise.all([getAuthenticatedUser(), getCurrentWorkspace()]);
  if (!workspace) return <ApiErrorPanel message="Your account does not have a workspace yet." />;

  let overview: ApiOverview;
  try {
    overview = await serverApiRequest<ApiOverview>(
      `/workspaces/${encodeURIComponent(workspace.id)}/overview`,
    );
  } catch (error) {
    return (
      <ApiErrorPanel
        message={error instanceof ApiError ? error.message : 'Dashboard data could not be loaded.'}
      />
    );
  }

  const greeting = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow={greeting}
        title={`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user?.name || user?.email.split('@')[0] || 'there'}`}
        description={`Here’s the latest from ${workspace.name}.`}
        actions={
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <Link href="/projects">
              <Plus size={16} aria-hidden="true" /> New task
            </Link>
          </Button>
        }
      />

      <section
        aria-label="Workspace statistics"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Active projects"
          value={String(overview.stats.activeProjectCount)}
          icon={FolderKanban}
          tone="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
        />
        <StatCard
          label="Tasks in progress"
          value={String(overview.stats.inProgress)}
          icon={Clock3}
          tone="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
        />
        <StatCard
          label="Completed this month"
          value={String(overview.stats.completedThisMonth)}
          icon={CheckCircle2}
          tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        />
        <StatCard
          label="Team members"
          value={String(overview.stats.memberCount)}
          icon={UsersRound}
          tone="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
        <ProgressChart projects={overview.projects} />
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">Project health</CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground">Live task completion</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Link href="/projects">
                All projects <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            {overview.projects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group block rounded-lg"
              >
                <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium group-hover:text-primary">
                    {project.name}
                  </span>
                  <span className="shrink-0 text-muted-foreground">{project.progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </Link>
            ))}
            {overview.projects.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Create a project to track its progress here.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent projects</h2>
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Link href="/projects">
                View all <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {overview.projects.slice(0, 4).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            {overview.projects.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                No projects yet.
              </div>
            )}
          </div>
        </div>
        <div className="space-y-5">
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
              <CardTitle className="text-sm font-semibold">Upcoming deadlines</CardTitle>
              <span className="text-[11px] text-muted-foreground">Next tasks due</span>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {overview.upcomingTasks.length ? (
                <ul className="divide-y divide-border/70">
                  {overview.upcomingTasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-3 py-3 first:pt-2">
                      <span className="grid min-h-8 min-w-8 place-items-center rounded-lg bg-muted px-1 text-[9px] font-semibold text-muted-foreground">
                        {formatDate(task.dueAt, '—')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{task.title}</p>
                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                          {task.project.name}
                        </p>
                      </div>
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[9px]">
                          {initials(task.assignee?.name ?? null, task.assignee?.email ?? 'NA')}
                        </AvatarFallback>
                      </Avatar>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No upcoming deadlines.
                </p>
              )}
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="mt-1 h-8 w-full text-xs text-muted-foreground"
              >
                <Link
                  href={
                    overview.projects[0]
                      ? `/projects/${overview.projects[0].id}/board`
                      : '/projects'
                  }
                >
                  Open task board <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <ActivityList items={overview.activity} />
        </div>
      </section>
    </div>
  );
}
