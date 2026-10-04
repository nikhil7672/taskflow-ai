'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { api, ApiError } from '@/lib/api-client';
import type { ApiProject } from '@/lib/api-types';

export function EditProjectDialog({
  project,
  onUpdated,
}: {
  project: ApiProject;
  onUpdated: (project: ApiProject) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const description = String(data.get('description') ?? '').trim() || null;
    const status = String(data.get('status') ?? 'PLANNING') as
      'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
    const dueDateValue = String(data.get('dueDate') ?? '');
    setSaving(true);
    try {
      const { project: updated } = await api.updateProject(project.id, {
        name,
        description,
        status,
        dueDate: dueDateValue || null,
      });
      onUpdated(updated);
      setOpen(false);
      toast.success('Project updated');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not update this project.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-9 rounded-xl">
          Edit project
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>Update this project’s details and status.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="edit-project-name" className="text-sm font-medium">
              Project name
            </label>
            <Input
              id="edit-project-name"
              name="name"
              required
              maxLength={160}
              defaultValue={project.name}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-project-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="edit-project-description"
              name="description"
              maxLength={10000}
              defaultValue={project.description ?? ''}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="edit-project-status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="edit-project-status"
                name="status"
                defaultValue={project.status}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-project-due-date" className="text-sm font-medium">
                Due date
              </label>
              <Input
                id="edit-project-due-date"
                name="dueDate"
                type="date"
                defaultValue={project.dueDate?.slice(0, 10) ?? ''}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
