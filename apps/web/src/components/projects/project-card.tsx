import { ArrowUpRight, CalendarDays, ListChecks, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectProgress } from '@/components/shared/project-progress';
import type { ProjectOverviewItem } from '@/lib/api-types';
import { formatDate } from '@/lib/format';

export function ProjectCard({
  project,
  list = false,
}: {
  project: ProjectOverviewItem;
  list?: boolean;
}) {
  const color = project.color ?? 'bg-indigo-500';
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card
        className={`h-full rounded-2xl border-border/80 shadow-none transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-foreground/[0.04] ${list ? 'sm:flex sm:items-center' : ''}`}
      >
        <CardContent
          className={`p-5 ${list ? 'sm:grid sm:w-full sm:grid-cols-[minmax(0,1.5fr)_minmax(160px,1fr)_120px_auto] sm:items-center sm:gap-5' : ''}`}
        >
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 size-10 shrink-0 rounded-xl ${color}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="truncate text-sm font-semibold tracking-tight group-hover:text-primary">
                  {project.name}
                </h2>
                <ArrowUpRight
                  size={15}
                  className="shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {project.description || 'No description yet.'}
              </p>
            </div>
          </div>
          <div className={`mt-5 ${list ? 'sm:mt-0' : ''}`}>
            <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium tabular-nums text-foreground">{project.progress}%</span>
            </div>
            <ProjectProgress value={project.progress} compact />
          </div>
          <div
            className={`mt-5 flex items-center justify-between text-[11px] text-muted-foreground ${list ? 'sm:mt-0 sm:block' : ''}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} aria-hidden="true" />
              {formatDate(project.dueDate)}
            </span>
            <span className="inline-flex items-center gap-1.5 sm:mt-2">
              <ListChecks size={13} aria-hidden="true" />
              {project.completedTaskCount}/{project.taskCount} tasks
            </span>
          </div>
          <div
            className={`mt-4 flex -space-x-2 ${list ? 'sm:mt-0 sm:justify-end' : ''}`}
            aria-label={`${project._count.members} project members`}
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
              <UsersRound size={12} aria-hidden="true" /> {project._count.members}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
