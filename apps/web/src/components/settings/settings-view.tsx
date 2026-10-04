'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, ApiError } from '@/lib/api-client';

function SettingRow({
  title,
  description,
  defaultChecked = false,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border-b border-border/70 py-4 last:border-0">
      <span>
        <span className="block text-xs font-medium">{title}</span>
        <span className="mt-1 block max-w-lg text-[11px] leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        aria-label={title}
        className="mt-0.5 size-4 shrink-0 accent-primary"
      />
    </label>
  );
}

type ManagedSession = {
  id: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
};

function SessionManager() {
  const [sessions, setSessions] = useState<ManagedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .sessions()
      .then((data) => {
        if (active) setSessions(data.sessions);
      })
      .catch((error: unknown) => {
        if (active)
          toast.error(
            error instanceof ApiError ? error.message : 'Could not load active sessions.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function revokeSession(sessionId: string) {
    setRevokingId(sessionId);
    try {
      await api.revokeSession(sessionId);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      toast.success('Session revoked');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Could not revoke that session. Please try again.',
      );
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <Card className="rounded-2xl border-border/80 shadow-none">
      <CardHeader className="p-5 pb-2">
        <CardTitle className="text-sm">Active sessions</CardTitle>
        <CardDescription className="text-xs">
          Review signed-in devices and revoke sessions you no longer use.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-2">
        {loading ? (
          <p className="py-4 text-xs text-muted-foreground">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <p className="py-4 text-xs text-muted-foreground">No active sessions found.</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 py-3 last:border-0"
            >
              <div>
                <p className="text-xs font-medium">
                  {session.current ? 'This device' : 'Signed-in device'}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Signed in {new Date(session.createdAt).toLocaleString()} · Expires{' '}
                  {new Date(session.expiresAt).toLocaleDateString()}
                </p>
              </div>
              {session.current ? (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                  Current
                </span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={revokingId === session.id}
                  onClick={() => void revokeSession(session.id)}
                  className="h-8 rounded-lg text-[11px]"
                >
                  {revokingId === session.id ? 'Revoking…' : 'Revoke'}
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function save(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  toast.success('Preferences saved in this preview', {
    description: 'Changes will reset when you refresh.',
  });
}

export function SettingsView({ profile }: { profile: { name: string | null; email: string } }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState(profile.name ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const result = await api.updateProfile(displayName.trim());
      setDisplayName(result.user.name ?? '');
      toast.success('Profile updated');
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Could not reach the authentication service.',
      );
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <Tabs defaultValue="profile" className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
      <TabsList
        aria-label="Settings categories"
        className="h-auto w-full flex-row justify-start overflow-x-auto rounded-xl bg-transparent p-0 lg:flex-col lg:items-stretch lg:gap-1"
      >
        <TabsTrigger value="profile" className="justify-start rounded-lg px-3 py-2.5 text-xs">
          Profile
        </TabsTrigger>
        <TabsTrigger value="workspace" className="justify-start rounded-lg px-3 py-2.5 text-xs">
          Workspace
        </TabsTrigger>
        <TabsTrigger value="notifications" className="justify-start rounded-lg px-3 py-2.5 text-xs">
          Notifications
        </TabsTrigger>
        <TabsTrigger value="appearance" className="justify-start rounded-lg px-3 py-2.5 text-xs">
          Appearance
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-0 space-y-5">
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="p-5 pb-4">
            <CardTitle className="text-sm">Personal information</CardTitle>
            <CardDescription className="text-xs">
              Update the details associated with your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="flex items-center gap-4 border-b border-border/70 pb-5">
                <Avatar className="size-14">
                  <AvatarFallback className="bg-violet-100 text-sm font-semibold text-violet-700">
                    {displayName
                      .split(/\s+/u)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() ?? '')
                      .join('') || profile.email.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-semibold">Profile photo</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Photo uploads will be available later.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  className="ml-auto h-8 text-[10px]"
                >
                  Change photo
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="settings-name" className="text-xs font-medium">
                    Full name
                  </label>
                  <Input
                    id="settings-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    autoComplete="name"
                    required
                    maxLength={160}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="settings-email" className="text-xs font-medium">
                    Email address
                  </label>
                  <Input
                    id="settings-email"
                    value={profile.email}
                    readOnly
                    type="email"
                    autoComplete="email"
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="settings-title" className="text-xs font-medium">
                    Job title
                  </label>
                  <Input
                    id="settings-title"
                    defaultValue="Product designer"
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="settings-timezone" className="text-xs font-medium">
                    Time zone
                  </label>
                  <select
                    id="settings-timezone"
                    defaultValue="Asia/Kolkata"
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
                  >
                    <option value="Asia/Kolkata">India Standard Time (UTC+5:30)</option>
                    <option value="America/Los_Angeles">Pacific Time (UTC−8)</option>
                    <option value="Europe/London">Greenwich Mean Time (UTC+0)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end border-t border-border/70 pt-4">
                <Button type="submit" size="sm" className="rounded-xl" disabled={savingProfile}>
                  {savingProfile ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm">Password</CardTitle>
            <CardDescription className="text-xs">
              Reset your password using a one-time link sent to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link href="/forgot-password">Reset password</Link>
            </Button>
          </CardContent>
        </Card>
        <SessionManager />
      </TabsContent>

      <TabsContent value="workspace" className="mt-0 space-y-5">
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="p-5 pb-4">
            <CardTitle className="text-sm">Workspace details</CardTitle>
            <CardDescription className="text-xs">
              Manage the shared identity for your team.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <form onSubmit={save} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="workspace-name" className="text-xs font-medium">
                  Workspace name
                </label>
                <Input
                  id="workspace-name"
                  defaultValue="Northstar Studio"
                  className="h-10 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="workspace-url" className="text-xs font-medium">
                  Workspace URL
                </label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-xl border border-r-0 border-input bg-muted px-3 text-[11px] text-muted-foreground">
                    taskflow.ai/
                  </span>
                  <Input
                    id="workspace-url"
                    defaultValue="northstar-studio"
                    className="h-10 rounded-l-none rounded-r-xl text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end border-t border-border/70 pt-4">
                <Button type="submit" size="sm" className="rounded-xl">
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm">Workspace defaults</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-2">
            <SettingRow
              title="Allow project creation"
              description="Members can start new projects in this workspace."
              defaultChecked
            />
            <SettingRow
              title="Show team activity"
              description="Display recent workspace activity on the overview page."
              defaultChecked
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications" className="mt-0">
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm">Notification preferences</CardTitle>
            <CardDescription className="text-xs">
              Choose which activity you’d like to see.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-2">
            <SettingRow
              title="Direct mentions"
              description="When someone mentions you in a task or comment."
              defaultChecked
            />
            <SettingRow
              title="Task assignments"
              description="When a task is assigned to you or changes owner."
              defaultChecked
            />
            <SettingRow
              title="Project updates"
              description="Milestones, due dates, and important project changes."
              defaultChecked
            />
            <SettingRow
              title="Weekly summary"
              description="A short recap of your team’s progress each Monday."
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="appearance" className="mt-0 space-y-5">
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm">Appearance</CardTitle>
            <CardDescription className="text-xs">
              Choose how TaskFlow looks on this device.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-5 pt-1 sm:grid-cols-3">
            {(['light', 'dark', 'system'] as const).map((theme) => (
              <button
                type="button"
                key={theme}
                onClick={() => setTheme(theme)}
                aria-pressed={resolvedTheme === theme}
                className={`rounded-xl border p-4 text-left transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${resolvedTheme === theme ? 'border-primary bg-primary/[0.04]' : 'border-border'}`}
              >
                <span
                  className={`mb-3 block h-14 rounded-lg border ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}
                >
                  <span className="m-2 block h-2 w-1/2 rounded bg-primary/70" />
                  <span className="mx-2 block h-2 w-3/4 rounded bg-muted-foreground/20" />
                </span>
                <span className="text-xs font-medium capitalize">{theme}</span>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm">Motion</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-2">
            <SettingRow
              title="Reduce motion"
              description="Limit interface animations where possible."
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
