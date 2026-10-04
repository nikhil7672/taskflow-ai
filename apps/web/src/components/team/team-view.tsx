'use client';

import { Search, UsersRound, UserMinus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeading } from '@/components/shared/page-heading';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api, ApiError } from '@/lib/api-client';
import type { ApiWorkspaceMember } from '@/lib/api-types';
import { initials } from '@/lib/format';

export function TeamView({
  workspaceId,
  workspaceName,
  initialMembers,
  totalMembers,
  actorRole,
}: {
  workspaceId: string;
  workspaceName: string;
  initialMembers: ApiWorkspaceMember[];
  totalMembers: number;
  actorRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
}) {
  const [members, setMembers] = useState(initialMembers);
  const [memberCount, setMemberCount] = useState(totalMembers);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<ApiWorkspaceMember | null>(null);
  const canManage = actorRole === 'OWNER' || actorRole === 'ADMIN';
  const canManageAdmins = actorRole === 'OWNER';
  const filteredMembers = useMemo(
    () =>
      members.filter((member) =>
        `${member.user.name ?? ''} ${member.user.email}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [members, query],
  );

  async function changeRole(userId: string, role: 'ADMIN' | 'MEMBER' | 'GUEST') {
    const previous = members;
    setMembers((current) =>
      current.map((member) => (member.user.id === userId ? { ...member, role } : member)),
    );
    setBusyId(userId);
    try {
      await api.updateWorkspaceMemberRole(workspaceId, userId, role);
      toast.success('Workspace role updated');
    } catch (error) {
      setMembers(previous);
      toast.error(error instanceof ApiError ? error.message : 'Could not update the member role.');
    } finally {
      setBusyId(null);
    }
  }

  async function removeMember(userId: string) {
    const previous = members;
    setMembers((current) => current.filter((member) => member.user.id !== userId));
    setMemberCount((current) => Math.max(0, current - 1));
    setBusyId(userId);
    try {
      await api.removeWorkspaceMember(workspaceId, userId);
      setRemoveTarget(null);
      toast.success('Member removed');
    } catch (error) {
      setMembers(previous);
      setMemberCount((current) => current + 1);
      toast.error(error instanceof ApiError ? error.message : 'Could not remove this member.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow={workspaceName}
        title="Your team"
        description="Review workspace members and their access."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <UsersRound size={17} aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-semibold">{memberCount}</p>
              <p className="text-[11px] text-muted-foreground">Workspace members</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardContent className="p-0">
          <div className="flex flex-col justify-between gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:px-5">
            <div>
              <h2 className="text-sm font-semibold">
                Members{' '}
                <span className="ml-1 font-normal text-muted-foreground">
                  ({filteredMembers.length})
                </span>
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                People with access to this workspace.
              </p>
            </div>
            <label className="relative w-full sm:max-w-[240px]">
              <Search
                size={14}
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search team members"
                placeholder="Search members"
                className="h-9 rounded-xl pl-9 text-xs"
              />
            </label>
          </div>
          <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(140px,0.8fr)_minmax(100px,0.6fr)_auto] gap-4 bg-muted/35 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
            <span>Name</span>
            <span>Role</span>
            <span>Status</span>
            <span />
          </div>
          <ul className="divide-y divide-border/70">
            {filteredMembers.map((member) => {
              const name = member.user.name || member.user.email;
              const canChangeThisRole =
                canManage &&
                member.role !== 'OWNER' &&
                (member.role !== 'ADMIN' || canManageAdmins);
              const canRemove =
                canManage &&
                member.role !== 'OWNER' &&
                (member.role !== 'ADMIN' || canManageAdmins);
              return (
                <li
                  key={member.user.id}
                  className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(140px,0.8fr)_minmax(100px,0.6fr)_auto] sm:items-center sm:gap-4 sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                        {initials(member.user.name, member.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:block">
                    <span className="text-[10px] text-muted-foreground sm:hidden">Role</span>
                    <select
                      aria-label={`Role for ${name}`}
                      value={member.role}
                      disabled={!canChangeThisRole || busyId === member.user.id}
                      onChange={(event) =>
                        void changeRole(
                          member.user.id,
                          event.target.value as 'ADMIN' | 'MEMBER' | 'GUEST',
                        )
                      }
                      className="rounded-md border border-border bg-background px-2 py-1 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                    >
                      <option value="OWNER">Owner</option>
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                      <option value="GUEST">Guest</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between sm:block">
                    <span className="text-[10px] text-muted-foreground sm:hidden">Status</span>
                    <Badge
                      variant="outline"
                      className="rounded-full border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                    >
                      Active
                    </Badge>
                  </div>
                  {canRemove ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${name}`}
                      disabled={busyId === member.user.id}
                      onClick={() => setRemoveTarget(member)}
                    >
                      <UserMinus size={15} aria-hidden="true" />
                    </Button>
                  ) : (
                    <span />
                  )}
                </li>
              );
            })}
          </ul>
          {filteredMembers.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No workspace members match that search.
            </div>
          )}
        </CardContent>
      </Card>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Workspace invitations are not available in the current API.
      </p>
      <Dialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Remove workspace member?</DialogTitle>
            <DialogDescription>
              {removeTarget?.user.name || removeTarget?.user.email} will lose access to this
              workspace and its projects. This can’t be undone without a new invitation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busyId !== null}
              onClick={() => removeTarget && void removeMember(removeTarget.user.id)}
            >
              {busyId ? 'Removing…' : 'Remove member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
