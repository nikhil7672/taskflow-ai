'use client';

import { useMemo, useState } from 'react';
import { UserMinus, UserPlus, UsersRound } from 'lucide-react';
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
import type { ApiProjectMember, ApiWorkspaceMember } from '@/lib/api-types';
import { api, ApiError } from '@/lib/api-client';
import { initials } from '@/lib/format';

export function ProjectMembersManager({
  projectId,
  initialMembers,
  workspaceMembers,
  canManage,
}: {
  projectId: string;
  initialMembers: ApiProjectMember[];
  workspaceMembers: ApiWorkspaceMember[];
  canManage: boolean;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState<ApiProjectMember['role']>('MEMBER');
  const [removeTarget, setRemoveTarget] = useState<ApiProjectMember | null>(null);
  const [saving, setSaving] = useState(false);
  const availableMembers = useMemo(
    () =>
      workspaceMembers.filter(
        (member) => !members.some((current) => current.user.id === member.user.id),
      ),
    [members, workspaceMembers],
  );

  async function addMember() {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const { member } = await api.addProjectMember(projectId, selectedUserId, role);
      const workspaceMember = workspaceMembers.find((item) => item.user.id === member.userId);
      if (!workspaceMember) throw new Error('The selected person is no longer in this workspace.');
      setMembers((current) => [...current, { ...member, user: workspaceMember.user }]);
      setSelectedUserId('');
      setAddOpen(false);
      toast.success('Project member added');
    } catch (error) {
      toast.error(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Could not add this project member.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeMember() {
    if (!removeTarget) return;
    setSaving(true);
    try {
      await api.removeProjectMember(projectId, removeTarget.user.id);
      setMembers((current) => current.filter((member) => member.user.id !== removeTarget.user.id));
      setRemoveTarget(null);
      toast.success('Project member removed');
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Could not remove this project member.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-0 p-5 sm:border-l sm:border-t-0 sm:px-7">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] text-muted-foreground">Project team</p>
          <p className="mt-1 text-xs font-medium">{members.length} members</p>
        </div>
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-[11px]"
            onClick={() => setAddOpen(true)}
          >
            <UsersRound size={13} aria-hidden="true" /> Manage
          </Button>
        )}
      </div>
      <div className="mt-3 flex min-w-0 items-center gap-2">
        <div className="flex -space-x-2" aria-label={`${members.length} project members`}>
          {members.slice(0, 5).map((member) => (
            <Avatar key={member.user.id} className="size-7 border-2 border-card">
              <AvatarFallback className="bg-muted text-[9px] font-semibold">
                {initials(member.user.name, member.user.email)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        {members.length === 0 && (
          <span className="text-[11px] text-muted-foreground">No members yet</span>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Manage project team</DialogTitle>
            <DialogDescription>
              Add people from this workspace or remove existing project access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
              <label className="sr-only" htmlFor="project-member-select">
                Workspace member
              </label>
              <select
                id="project-member-select"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className="h-10 min-w-0 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Choose a workspace member…</option>
                {availableMembers.map(({ user }) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email} · {user.email}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="project-member-role">
                Project role
              </label>
              <select
                id="project-member-role"
                value={role}
                onChange={(event) => setRole(event.target.value as ApiProjectMember['role'])}
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="MEMBER">Member</option>
                <option value="VIEWER">Viewer</option>
                <option value="ADMIN">Admin</option>
              </select>
              <Button disabled={!selectedUserId || saving} onClick={() => void addMember()}>
                <UserPlus size={14} aria-hidden="true" /> Add
              </Button>
            </div>
            {availableMembers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Everyone in this workspace already has project access.
              </p>
            )}
            <ul className="max-h-64 divide-y overflow-y-auto rounded-xl border">
              {members.map((member) => (
                <li key={member.user.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-[9px]">
                      {initials(member.user.name, member.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-xs">
                    {member.user.name || member.user.email}
                  </span>
                  <Badge variant="secondary" className="text-[9px]">
                    {member.role}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${member.user.name || member.user.email}`}
                    onClick={() => setRemoveTarget(member)}
                  >
                    <UserMinus size={14} aria-hidden="true" />
                  </Button>
                </li>
              ))}
              {members.length === 0 && (
                <li className="p-4 text-center text-xs text-muted-foreground">
                  This project has no members yet.
                </li>
              )}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Remove project access?</DialogTitle>
            <DialogDescription>
              {removeTarget?.user.name || removeTarget?.user.email} will no longer be able to access
              this project. This can be undone by adding them again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={saving} onClick={() => void removeMember()}>
              {saving ? 'Removing…' : 'Remove member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
