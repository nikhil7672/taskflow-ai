'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link2, MessageSquareText, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { api, ApiError } from '@/lib/api-client';
import type { ApiTask, ApiTaskComment, ApiTaskDependency } from '@/lib/api-types';
import { formatDate, initials } from '@/lib/format';

export function TaskCollaborationDialog({
  task,
  tasks,
  canWrite,
  open,
  onOpenChange,
}: {
  task: ApiTask;
  tasks: ApiTask[];
  canWrite: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [comments, setComments] = useState<ApiTaskComment[]>([]);
  const [dependencies, setDependencies] = useState<ApiTaskDependency[]>([]);
  const [loadedTaskId, setLoadedTaskId] = useState<string | null>(null);
  const loading = open && loadedTaskId !== task.id;
  const [error, setError] = useState<string | null>(null);
  const [savingComment, setSavingComment] = useState(false);
  const [savingDependency, setSavingDependency] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState('');
  const [removingDependencyId, setRemovingDependencyId] = useState<string | null>(null);
  const availableTasks = useMemo(() => {
    const existing = new Set(dependencies.map((item) => item.dependsOnId));
    return tasks.filter((item) => item.id !== task.id && !existing.has(item.id));
  }, [dependencies, task.id, tasks]);

  useEffect(() => {
    if (!open || loadedTaskId === task.id) return;
    let active = true;
    Promise.all([api.comments(task.id), api.dependencies(task.id)])
      .then(([commentResult, dependencyResult]) => {
        if (!active) return;
        setComments(commentResult.items);
        setDependencies(dependencyResult.items);
        setError(null);
        setLoadedTaskId(task.id);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof ApiError ? reason.message : 'Could not load task discussion.');
          setLoadedTaskId(task.id);
        }
      });
    return () => {
      active = false;
    };
  }, [loadedTaskId, open, task.id]);

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const content = String(data.get('content') ?? '').trim();
    if (!content) return;
    setSavingComment(true);
    try {
      const { comment } = await api.addComment(task.id, content);
      setComments((current) => [...current, comment]);
      form.reset();
      toast.success('Comment added');
    } catch (reason) {
      toast.error(reason instanceof ApiError ? reason.message : 'Could not add your comment.');
    } finally {
      setSavingComment(false);
    }
  }

  async function addDependency() {
    if (!selectedDependency || !canWrite) return;
    setSavingDependency(true);
    try {
      const { dependency } = await api.addDependency(task.id, selectedDependency);
      setDependencies((current) => [...current, dependency]);
      setSelectedDependency('');
      toast.success('Dependency added');
    } catch (reason) {
      toast.error(reason instanceof ApiError ? reason.message : 'Could not add this dependency.');
    } finally {
      setSavingDependency(false);
    }
  }

  async function removeDependency(dependency: ApiTaskDependency) {
    setRemovingDependencyId(dependency.dependsOnId);
    try {
      await api.removeDependency(task.id, dependency.dependsOnId);
      setDependencies((current) =>
        current.filter((item) => item.dependsOnId !== dependency.dependsOnId),
      );
      toast.success('Dependency removed');
    } catch (reason) {
      toast.error(
        reason instanceof ApiError ? reason.message : 'Could not remove this dependency.',
      );
    } finally {
      setRemovingDependencyId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-2xl sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="pr-8">{task.title}</DialogTitle>
          <DialogDescription>Comments and task dependencies</DialogDescription>
        </DialogHeader>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          >
            {error}
          </p>
        )}
        {loading ? (
          <p role="status" className="py-8 text-center text-xs text-muted-foreground">
            Loading collaboration…
          </p>
        ) : (
          <div className="space-y-6">
            <section aria-labelledby="task-dependencies-title" className="space-y-3">
              <div className="flex items-center gap-2">
                <Link2 size={15} className="text-muted-foreground" aria-hidden="true" />
                <h3 id="task-dependencies-title" className="text-xs font-semibold">
                  Depends on
                </h3>
              </div>
              {dependencies.length ? (
                <ul className="space-y-2">
                  {dependencies.map((dependency) => (
                    <li
                      key={dependency.dependsOnId}
                      className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
                    >
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">
                        {dependency.dependsOn.title}
                      </span>
                      <Badge variant="outline" className="shrink-0 text-[9px]">
                        {dependency.dependsOn.status.replaceAll('_', ' ')}
                      </Badge>
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          aria-label={`Remove dependency ${dependency.dependsOn.title}`}
                          disabled={removingDependencyId === dependency.dependsOnId}
                          onClick={() => void removeDependency(dependency)}
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  No dependencies. This task can start independently.
                </p>
              )}
              {canWrite && (
                <div className="flex gap-2">
                  <label className="sr-only" htmlFor="add-task-dependency">
                    Task this work depends on
                  </label>
                  <select
                    id="add-task-dependency"
                    value={selectedDependency}
                    onChange={(event) => setSelectedDependency(event.target.value)}
                    className="h-9 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-xs"
                  >
                    <option value="">Choose a prerequisite…</option>
                    {availableTasks.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.title}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    disabled={!selectedDependency || savingDependency}
                    onClick={() => void addDependency()}
                  >
                    {savingDependency ? 'Adding…' : 'Add dependency'}
                  </Button>
                </div>
              )}
            </section>
            <section aria-labelledby="task-comments-title" className="space-y-3 border-t pt-5">
              <div className="flex items-center gap-2">
                <MessageSquareText size={15} className="text-muted-foreground" aria-hidden="true" />
                <h3 id="task-comments-title" className="text-xs font-semibold">
                  Comments{' '}
                  <span className="font-normal text-muted-foreground">({comments.length})</span>
                </h3>
              </div>
              {comments.length ? (
                <ol className="max-h-64 space-y-3 overflow-y-auto">
                  {comments.map((comment) => (
                    <li key={comment.id} className="flex gap-2.5">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[9px]">
                          {initials(comment.author?.name ?? null)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 rounded-xl bg-muted/60 px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[11px] font-semibold">
                            {comment.author?.name || 'Former member'}
                          </span>
                          <time
                            dateTime={comment.createdAt}
                            className="shrink-0 text-[9px] text-muted-foreground"
                          >
                            {formatDate(comment.createdAt)}
                          </time>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5">
                          {comment.content}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  No comments yet. Start the discussion.
                </p>
              )}
              {canWrite ? (
                <form onSubmit={addComment} className="space-y-2">
                  <label className="sr-only" htmlFor="task-comment-content">
                    Write a comment
                  </label>
                  <Textarea
                    id="task-comment-content"
                    name="content"
                    rows={3}
                    maxLength={20000}
                    required
                    placeholder="Share an update or ask a question…"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" type="submit" disabled={savingComment}>
                      {savingComment ? (
                        'Posting…'
                      ) : (
                        <>
                          Post comment <Send size={13} aria-hidden="true" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  You have read-only access to this task.
                </p>
              )}
            </section>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
