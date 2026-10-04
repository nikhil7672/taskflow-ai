import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProjectOverviewItem } from '@/lib/api-types';

export function ProgressChart({ projects }: { projects: ProjectOverviewItem[] }) {
  const visible = projects.slice(0, 8);
  return (
    <Card className="rounded-2xl border-border/80 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5 pb-0">
        <div>
          <CardTitle className="text-sm font-semibold">Project completion</CardTitle>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Progress calculated from completed tasks.
          </p>
        </div>
        <span className="rounded-lg border border-border px-2 py-1 text-[10px] text-muted-foreground">
          {projects.length} projects
        </span>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5 pt-4">
        {visible.length ? (
          visible.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="group block">
              <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]">
                <span className="truncate font-medium group-hover:text-primary">
                  {project.name}
                </span>
                <span className="tabular-nums text-muted-foreground">{project.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {project.completedTaskCount} of {project.taskCount} tasks complete
              </p>
            </Link>
          ))
        ) : (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Projects will appear here as you create them.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
