'use client';

import {
  AlertTriangle,
  CalendarDays,
  Check,
  Circle,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TaskCollaborationDialog } from '@/components/board/task-collaboration-dialog';
import { api, ApiError } from '@/lib/api-client';
import type { ApiProject, ApiTask, ApiTaskPriority, ApiTaskStatus } from '@/lib/api-types';
import { deadlineWarning, formatDate, initials } from '@/lib/format';

const statuses: Array<{ value: ApiTaskStatus; label: string }> = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'IN_REVIEW', label: 'In review' },
  { value: 'DONE', label: 'Done' },
  { value: 'CANCELED', label: 'Canceled' },
];
const columns: Array<{ value: ApiTaskStatus; label: string; statuses: ApiTaskStatus[] }> = [
  { value: 'TODO', label: 'To Do', statuses: ['BACKLOG', 'TODO'] },
  { value: 'IN_PROGRESS', label: 'In Progress', statuses: ['IN_PROGRESS'] },
  { value: 'IN_REVIEW', label: 'In Review', statuses: ['IN_REVIEW'] },
  { value: 'DONE', label: 'Completed', statuses: ['DONE', 'CANCELED'] },
];
const priorities: ApiTaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const priorityTone: Record<ApiTaskPriority, string> = {
  LOW: 'border-border bg-muted text-muted-foreground',
  MEDIUM:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300',
  HIGH: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300',
  URGENT:
    'border-red-300 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
};

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : '';
}

export function BoardView({
  project,
  initialTasks,
  canWrite,
  canDelete,
}: {
  project: ApiProject;
  initialTasks: ApiTask[];
  canWrite: boolean;
  canDelete: boolean;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searching, setSearching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ApiTask | null>(null);
  const [collaborationTask, setCollaborationTask] = useState<ApiTask | null>(null);
  const [deleteTask, setDeleteTask] = useState<ApiTask | null>(null);
  const [movingTaskIds, setMovingTaskIds] = useState<Set<string>>(new Set());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApiTaskStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const initialRequest = useRef(true);

  useEffect(() => {
    if (initialRequest.current) {
      initialRequest.current = false;
      return;
    }
    let active = true;
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      setFetchError(null);
      try {
        const result = await api.tasks(project.id, {
          search: query.trim(),
          status: statusFilter || undefined,
          pageSize: 100,
        });
        if (active) setTasks(result.items);
      } catch (error) {
        if (active)
          setFetchError(error instanceof ApiError ? error.message : 'Could not refresh tasks.');
      } finally {
        if (active) setSearching(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [project.id, query, statusFilter]);

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get('title') ?? '').trim();
    const description = String(data.get('description') ?? '').trim();
    const priority = String(data.get('priority') ?? 'MEDIUM') as ApiTaskPriority;
    const dueDate = String(data.get('dueDate') ?? '');
    if (!title) return;
    setSaving(true);
    try {
      const { task } = await api.createTask(project.id, {
        title,
        description,
        priority,
        ...(dueDate ? { dueAt: `${dueDate}T23:59:00.000Z` } : {}),
      });
      setTasks((current) => [task, ...current]);
      setDialogOpen(false);
      form.reset();
      toast.success('Task created');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not create the task.');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(task: ApiTask, status: ApiTaskStatus) {
    if (movingTaskIds.has(task.id) || task.status === status) return;
    const previous = task;
    const optimistic = {
      ...task,
      status,
      completedAt: status === 'DONE' ? new Date().toISOString() : null,
    };
    setMovingTaskIds((current) => new Set(current).add(task.id));
    setTasks((current) => current.map((item) => (item.id === task.id ? optimistic : item)));
    try {
      const { task: updated } = await api.updateTaskStatus(task.id, status);
      setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
    } catch (error) {
      setTasks((current) => current.map((item) => (item.id === task.id ? previous : item)));
      toast.error(error instanceof ApiError ? error.message : 'Could not update task status.');
    } finally {
      setMovingTaskIds((current) => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
    }
  }

  async function removeTask(taskId: string) {
    try {
      await api.removeTask(taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
      setDeleteTask(null);
      toast.success('Task deleted');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not delete this task.');
    }
  }

  function taskIsOverdue(task: ApiTask) {
    return deadlineWarning(task.dueAt, ['DONE', 'CANCELED'].includes(task.status)) === 'overdue';
  }

  function taskIsDueSoon(task: ApiTask) {
    return deadlineWarning(task.dueAt, ['DONE', 'CANCELED'].includes(task.status)) === 'soon';
  }

  async function updateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTask) return;
    const data = new FormData(event.currentTarget);
    const dueDate = String(data.get('dueDate') ?? '');
    const assigneeId = String(data.get('assigneeId') ?? '');
    setSaving(true);
    try {
      const { task } = await api.updateTask(editingTask.id, {
        title: String(data.get('title') ?? '').trim(),
        description: String(data.get('description') ?? '').trim() || null,
        priority: String(data.get('priority') ?? 'MEDIUM') as ApiTaskPriority,
        dueAt: dueDate ? `${dueDate}T23:59:00.000Z` : null,
        assigneeId: assigneeId || null,
      });
      setTasks((current) => current.map((item) => (item.id === task.id ? task : item)));
      setEditingTask(null);
      toast.success('Task updated');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not update the task.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          <label className="relative w-full sm:w-auto">
            <Search
              size={15}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search tasks"
              placeholder="Find a task…"
              className="h-9 w-full rounded-xl pl-9 text-xs sm:w-64"
            />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-xl border border-input bg-background px-3 text-xs"
            >
              <option value="">All statuses</option>
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          {searching && (
            <span className="self-center text-[11px] text-muted-foreground">Searching…</span>
          )}
        </div>
        {canWrite && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 rounded-xl text-xs">
                <Plus size={15} aria-hidden="true" /> Add task
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-[460px]">
              <DialogHeader>
                <DialogTitle>Add a task</DialogTitle>
                <DialogDescription>Create a task in {project.name}.</DialogDescription>
              </DialogHeader>
              <form onSubmit={createTask} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="task-title" className="text-sm font-medium">
                    Task name
                  </label>
                  <Input
                    id="task-title"
                    name="title"
                    placeholder="What needs to get done?"
                    required
                    maxLength={240}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="task-description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="task-description"
                    name="description"
                    rows={3}
                    maxLength={20000}
                    placeholder="Add a little context"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="task-priority" className="text-sm font-medium">
                      Priority
                    </label>
                    <select
                      id="task-priority"
                      name="priority"
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    >
                      {priorities.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="task-due" className="text-sm font-medium">
                      Deadline
                    </label>
                    <Input id="task-due" name="dueDate" type="date" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Creating…' : 'Add task'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {fetchError && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          {fetchError}
        </p>
      )}
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-7 sm:px-7 xl:-mx-10 xl:px-10">
        <div className="flex min-w-max items-start gap-3">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => column.statuses.includes(task.status));
            return (
              <section
                key={column.value}
                aria-label={`${column.label}, ${columnTasks.length} tasks`}
                onDragOver={(event) => {
                  if (canWrite) {
                    event.preventDefault();
                    setDragOverColumn(column.value);
                  }
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node))
                    setDragOverColumn(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const taskId = event.dataTransfer.getData('text/taskflow-task') || draggedTaskId;
                  const movedTask = tasks.find((task) => task.id === taskId);
                  if (movedTask) void changeStatus(movedTask, column.value);
                  setDraggedTaskId(null);
                  setDragOverColumn(null);
                }}
                className={`w-[272px] rounded-2xl p-2.5 transition-colors sm:w-[286px] ${dragOverColumn === column.value ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-muted/55'}`}
              >
                <div className="flex items-center justify-between px-1.5 pb-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${column.value === 'DONE' ? 'bg-emerald-500' : column.value === 'IN_PROGRESS' ? 'bg-sky-500' : column.value === 'IN_REVIEW' ? 'bg-violet-500' : 'bg-slate-400'}`}
                    />
                    <h2 className="text-xs font-semibold">{column.label}</h2>
                    <span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {columnTasks.map((task) => (
                    <Card
                      key={task.id}
                      draggable={canWrite && !movingTaskIds.has(task.id)}
                      onDragStart={(event) => {
                        setDraggedTaskId(task.id);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/taskflow-task', task.id);
                      }}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setDragOverColumn(null);
                      }}
                      className={`group rounded-xl border-border/75 bg-card shadow-none transition-all hover:shadow-md ${canWrite ? 'cursor-grab active:cursor-grabbing' : ''} ${draggedTaskId === task.id ? 'scale-[0.98] opacity-45' : ''}`}
                    >
                      <CardContent className="p-3.5">
                        <div className="flex items-start gap-2">
                          {task.status === 'DONE' ? (
                            <Check
                              size={15}
                              className="mt-0.5 shrink-0 text-emerald-600"
                              aria-label="Done"
                            />
                          ) : (
                            <Circle
                              size={15}
                              className="mt-0.5 shrink-0 text-muted-foreground/50"
                              aria-hidden="true"
                            />
                          )}
                          <h3 className="flex-1 text-xs font-medium leading-5">{task.title}</h3>
                          {canWrite && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="-mr-2 -mt-2 size-7"
                              aria-label={`Edit ${task.title}`}
                              onClick={() => setEditingTask(task)}
                            >
                              <Pencil size={13} aria-hidden="true" />
                            </Button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteTask(task)}
                              aria-label={`Delete ${task.title}`}
                              className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-rose-600 focus:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                        {task.status === 'CANCELED' && (
                          <Badge variant="outline" className="mt-2 text-[9px]">
                            Canceled
                          </Badge>
                        )}
                        <p className="mt-2 text-[10px] font-medium text-muted-foreground">
                          {project.name}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={`h-5 rounded-md px-1.5 text-[9px] ${priorityTone[task.priority]}`}
                          >
                            {task.priority}
                          </Badge>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] ${taskIsOverdue(task) ? 'font-semibold text-destructive' : taskIsDueSoon(task) ? 'font-medium text-amber-600' : 'text-muted-foreground'}`}
                          >
                            {taskIsOverdue(task) || taskIsDueSoon(task) ? (
                              <AlertTriangle size={11} aria-hidden="true" />
                            ) : (
                              <CalendarDays size={11} aria-hidden="true" />
                            )}
                            {formatDate(task.dueAt, 'No deadline')}
                          </span>
                          <Avatar className="size-6">
                            <AvatarFallback className="text-[8px]">
                              {initials(task.assignee?.name ?? null, task.assignee?.email ?? 'NA')}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/70 pt-2.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] text-muted-foreground"
                            onClick={() => setCollaborationTask(task)}
                          >
                            <MessageSquareText size={12} aria-hidden="true" /> Discuss
                          </Button>
                          {canWrite && (
                            <div className="min-w-0 flex-1">
                              <label htmlFor={`status-${task.id}`} className="sr-only">
                                Move {task.title} to
                              </label>
                              <select
                                id={`status-${task.id}`}
                                value={task.status}
                                disabled={movingTaskIds.has(task.id)}
                                onChange={(event) =>
                                  void changeStatus(task, event.target.value as ApiTaskStatus)
                                }
                                className="w-full cursor-pointer bg-transparent text-[10px] text-muted-foreground outline-none focus-visible:text-foreground"
                              >
                                {statuses.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border/80 bg-background/40 px-4 text-center text-[11px] text-muted-foreground">
                      {query || statusFilter ? 'No matching tasks' : 'No tasks here yet'}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {collaborationTask && (
        <TaskCollaborationDialog
          task={collaborationTask}
          tasks={tasks}
          canWrite={canWrite}
          open={collaborationTask !== null}
          onOpenChange={(open) => {
            if (!open) setCollaborationTask(null);
          }}
        />
      )}

      <Dialog
        open={deleteTask !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTask(null);
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete this task?</DialogTitle>
            <DialogDescription>
              This permanently removes “{deleteTask?.title}” and its comments. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTask(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTask && void removeTask(deleteTask.id)}
            >
              Delete task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingTask !== null}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null);
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>
              Update the task details, deadline, priority, or assignee.
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <form key={editingTask.id} onSubmit={updateTask} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="edit-task-title" className="text-sm font-medium">
                  Task name
                </label>
                <Input
                  id="edit-task-title"
                  name="title"
                  required
                  maxLength={240}
                  defaultValue={editingTask.title}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-task-description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="edit-task-description"
                  name="description"
                  maxLength={20000}
                  rows={3}
                  defaultValue={editingTask.description ?? ''}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="edit-task-priority" className="text-sm font-medium">
                    Priority
                  </label>
                  <select
                    id="edit-task-priority"
                    name="priority"
                    defaultValue={editingTask.priority}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="edit-task-due" className="text-sm font-medium">
                    Deadline
                  </label>
                  <Input
                    id="edit-task-due"
                    name="dueDate"
                    type="date"
                    defaultValue={dateInputValue(editingTask.dueAt)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-task-assignee" className="text-sm font-medium">
                  Assignee
                </label>
                <select
                  id="edit-task-assignee"
                  name="assigneeId"
                  defaultValue={editingTask.assigneeId ?? ''}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Unassigned</option>
                  {project.members?.map((member) => (
                    <option key={member.user.id} value={member.user.id}>
                      {member.user.name || member.user.email}
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save task'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
