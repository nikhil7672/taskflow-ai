'use client';

import { Grid2X2, List, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { NewProjectDialog } from '@/components/projects/new-project-dialog';
import { ProjectCard } from '@/components/projects/project-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import type { ProjectOverviewItem } from '@/lib/api-types';

const filters = ['All projects', 'In progress', 'Completed'] as const;

export function ProjectsView({
  workspaceId,
  initialProjects,
}: {
  workspaceId: string;
  initialProjects: ProjectOverviewItem[];
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof filters)[number]>('All projects');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const visibleProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesQuery = `${project.name} ${project.description ?? ''}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
        const matchesFilter =
          filter === 'All projects' ||
          (filter === 'Completed'
            ? project.status === 'COMPLETED'
            : ['ACTIVE', 'ON_HOLD'].includes(project.status));
        return matchesQuery && matchesFilter;
      }),
    [filter, projects, query],
  );

  async function createProject(name: string, description: string, slug: string) {
    const { project } = await api.createProject(workspaceId, { name, description, slug });
    const nextProject: ProjectOverviewItem = {
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      slug: project.slug,
      description: project.description,
      status: project.status,
      color: project.color,
      dueDate: project.dueDate,
      updatedAt: project.updatedAt,
      taskCount: 0,
      completedTaskCount: 0,
      progress: 0,
      _count: { members: 1 },
    };
    setProjects((current) => [nextProject, ...current]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex items-center gap-1 rounded-xl bg-muted/70 p-1"
          aria-label="Project filters"
        >
          {filters.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={filter === item ? 'secondary' : 'ghost'}
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className="h-8 rounded-lg px-3 text-xs"
            >
              {item}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="relative hidden sm:block">
            <Search
              size={15}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a project"
              aria-label="Search projects"
              className="h-9 w-48 rounded-xl pl-9 text-xs"
            />
          </label>
          <div
            className="hidden items-center rounded-xl border border-border p-0.5 sm:flex"
            aria-label="Choose project layout"
          >
            <Button
              type="button"
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
              className="size-8 rounded-lg"
            >
              <Grid2X2 size={15} aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              aria-label="List view"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
              className="size-8 rounded-lg"
            >
              <List size={16} aria-hidden="true" />
            </Button>
          </div>
          <NewProjectDialog onCreate={createProject} />
        </div>
      </div>

      {visibleProjects.length ? (
        <div
          className={view === 'grid' ? 'grid gap-4 md:grid-cols-2 2xl:grid-cols-3' : 'space-y-3'}
        >
          {visibleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} list={view === 'list'} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title={projects.length ? 'No projects found' : 'No projects yet'}
          description={
            projects.length
              ? 'Try another name or clear the current search and filters.'
              : 'Create a project to give your team work a clear home.'
          }
          actionLabel={projects.length ? 'Clear search' : undefined}
          onAction={() => {
            setQuery('');
            setFilter('All projects');
          }}
        />
      )}
    </div>
  );
}
