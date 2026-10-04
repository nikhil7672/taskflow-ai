'use client';

import { Plus } from 'lucide-react';
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
import { ApiError } from '@/lib/api-client';

export function NewProjectDialog({
  onCreate,
}: {
  onCreate: (name: string, description: string, slug: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const description = String(data.get('description') ?? '').trim();
    if (!name) return;
    const slug = name
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[\u0300-\u036f]/gu, '')
      .replace(/[^a-z0-9]+/gu, '-')
      .replace(/^-|-$/gu, '')
      .slice(0, 145);
    if (!slug) {
      toast.error('Choose a project name with at least one letter or number.');
      return;
    }
    setSubmitting(true);
    try {
      await onCreate(name, description, slug);
      setOpen(false);
      toast.success('Project created');
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Could not create the project. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 rounded-xl">
          <Plus size={16} aria-hidden="true" /> New project
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create a project</DialogTitle>
          <DialogDescription>Give your next piece of work a clear home.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="project-name" className="text-sm font-medium">
              Project name
            </label>
            <Input
              id="project-name"
              name="name"
              placeholder="e.g. Customer onboarding"
              autoFocus
              required
              maxLength={70}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="project-description" className="text-sm font-medium">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="project-description"
              name="description"
              placeholder="What does this project aim to accomplish?"
              rows={3}
              maxLength={240}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
