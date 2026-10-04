'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, CircleCheck, Clock3, Plus } from 'lucide-react';
import Link from 'next/link';
import { EditProjectDialog } from '@/components/projects/edit-project-dialog';
import { ProjectProgress } from '@/components/shared/project-progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProjectMembersManager } from '@/components/projects/project-members-manager';
import { ProjectActivityTimeline } from '@/components/projects/project-activity-timeline';
import type { ApiProject, ApiProjectActivity, ApiTask, ApiWorkspaceMember } from '@/lib/api-types';
import { formatDate, initials } from '@/lib/format';

const statusLabel: Record<ApiProject['status'], string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export function ProjectDetailsView({
  initialProject,
  tasks,
  canManage,
  workspaceMembers,
  activity,
  activityFailed,
}: {
  initialProject: ApiProject;
  tasks: ApiTask[];
  canManage: boolean;
  workspaceMembers: ApiWorkspaceMember[];
  activity: ApiProjectActivity[];
  activityFailed: boolean;
}) {
  const [project, setProject] = useState(initialProject);
  const completed = tasks.filter((task) => task.status === 'DONE').length;
  const inProgress = tasks.filter(
    (task) => task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW',
  ).length;
  const todo = tasks.filter((task) => task.status === 'TODO' || task.status === 'BACKLOG').length;
  const buckets: Array<{ value: number; label: string; tone: string }> = [
    { value: completed, label: 'Completed', tone: 'text-emerald-600' },
    { value: inProgress, label: 'In progress', tone: 'text-sky-600' },
    { value: todo, label: 'To do', tone: 'text-amber-600' },
  ];
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const color = project.color ?? 'bg-indigo-500';

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={14} aria-hidden="true" /> All projects
      </Link>
      <section className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className={`h-2 ${color}`} />
        <div className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-start sm:p-7">
          <div className="flex items-start gap-4">
            <span className={`mt-1 size-12 shrink-0 rounded-2xl ${color}`} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
                <Badge variant="secondary" className="rounded-full">
                  {statusLabel[project.status]}
                </Badge>
              </div>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                {project.description || 'No project description has been added.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:pt-1">
            {canManage && <EditProjectDialog project={project} onUpdated={setProject} />}
            <Button asChild className="h-9 rounded-xl">
              <Link href={`/projects/${project.id}/board`}>
                Open board <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid border-t border-border/70 sm:grid-cols-3">
          <div className="p-5 sm:px-7">
            <p className="text-[11px] text-muted-foreground">Project lead</p>
            <div className="mt-2 flex items-center gap-2">
              <Avatar className="size-7">
                <AvatarFallback className="bg-violet-100 text-[9px] font-semibold text-violet-700">
                  {initials(
                    project.members?.find((member) => member.role === 'ADMIN')?.user.name ?? null,
                    'PL',
                  )}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">
                {project.members?.find((member) => member.role === 'ADMIN')?.user.name ??
                  'Project administrator'}
              </span>
            </div>
          </div>
          <div className="border-t border-border/70 p-5 sm:border-l sm:border-t-0 sm:px-7">
            <p className="text-[11px] text-muted-foreground">Due date</p>
            <p className="mt-2 flex items-center gap-2 text-xs font-medium">
              <CalendarDays size={15} className="text-muted-foreground" aria-hidden="true" />
              {formatDate(project.dueDate)}
            </p>
          </div>
          <ProjectMembersManager
            projectId={project.id}
            initialMembers={project.members ?? []}
            workspaceMembers={workspaceMembers}
            canManage={canManage}
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.8fr]">
        <div className="space-y-5">
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
              <div>
                <CardTitle className="text-sm">Progress</CardTitle>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Calculated from tasks in this project.
                </p>
              </div>
              <span className="text-xl font-semibold">{progress}%</span>
            </CardHeader>
            <CardContent className="space-y-5 px-5 pb-5">
              <ProjectProgress value={progress} />
              <div className="grid grid-cols-3 gap-3">
                {buckets.map(({ value, label, tone }) => (
                  <div key={label} className="rounded-xl bg-muted/60 p-3">
                    <p className={`text-lg font-semibold ${tone}`}>{value}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
              <div>
                <CardTitle className="text-sm">Tasks</CardTitle>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Live tasks from this project.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-xs">
                <Link href={`/projects/${project.id}/board`}>
                  View board <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-2">
              <ul className="divide-y divide-border/70">
                {tasks.slice(0, 5).map((task) => (
                  <li key={task.id} className="flex items-center gap-3 py-3.5">
                    {task.status === 'DONE' ? (
                      <CircleCheck size={17} className="text-emerald-600" aria-label="Complete" />
                    ) : (
                      <span
                        className="size-[17px] rounded-full border border-border"
                        aria-hidden="true"
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {task.title}
                    </span>
                    <Badge
                      variant="outline"
                      className="hidden text-[10px] font-normal sm:inline-flex"
                    >
                      {task.status.replaceAll('_', ' ')}
                    </Badge>
                    <span className="hidden text-[10px] text-muted-foreground md:inline">
                      {formatDate(task.dueAt, 'No deadline')}
                    </span>
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[9px] font-semibold">
                        {initials(task.assignee?.name ?? null, task.assignee?.email ?? 'NA')}
                      </AvatarFallback>
                    </Avatar>
                  </li>
                ))}
                {tasks.length === 0 && (
                  <li className="py-8 text-center text-xs text-muted-foreground">
                    No tasks in this project yet.
                  </li>
                )}
              </ul>
              <Button
                asChild
                variant="ghost"
                className="mb-2 mt-2 h-8 w-full text-xs text-muted-foreground"
              >
                <Link href={`/projects/${project.id}/board`}>
                  <Plus size={14} aria-hidden="true" /> Add a task
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit rounded-2xl border-border/80 shadow-none">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm">Project summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            <p className="text-xs leading-5 text-muted-foreground">
              {completed} of {tasks.length} tasks are complete. Keep the project status and
              deadlines current as work progresses.
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Completion</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress
              value={progress}
              aria-label={`Project completion ${progress}%`}
              className="h-1.5"
            />
            <div className="flex justify-between border-t border-border/70 pt-4 text-[11px]">
              <span className="text-muted-foreground">Project status</span>
              <span className="font-medium">{statusLabel[project.status]}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Target date</span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Clock3 size={13} aria-hidden="true" />
                {formatDate(project.dueDate)}
              </span>
            </div>
          </CardContent>
        </Card>
        <ProjectActivityTimeline items={activity} failed={activityFailed} />
      </div>
    </div>
  );
}
