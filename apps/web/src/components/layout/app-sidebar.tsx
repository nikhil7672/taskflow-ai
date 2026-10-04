'use client';

import {
  Bell,
  CircleHelp,
  FolderKanban,
  LayoutDashboard,
  Settings2,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { cn } from '@/lib/utils';

const sections = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Projects', href: '/projects', icon: FolderKanban },
      { label: 'Team', href: '/team', icon: UsersRound },
    ],
  },
  {
    label: 'Personal',
    items: [
      { label: 'AI assistant', href: '/assistant', icon: Sparkles },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Settings', href: '/settings', icon: Settings2 },
    ],
  },
];

type AppSidebarProps = {
  onNavigate?: () => void;
  user: { name: string | null; email: string; workspaceName: string };
};

export function AppSidebar({ onNavigate, user }: AppSidebarProps) {
  const pathname = usePathname();
  const initials = (user.name ?? user.email)
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex h-full flex-col bg-sidebar px-3 py-4 text-sidebar-foreground">
      <Link href="/dashboard" onClick={onNavigate} className="mb-7 flex items-center gap-3 px-2">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <FolderKanban aria-hidden="true" size={18} />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">TaskFlow</span>
        <span className="rounded-md bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-sidebar-accent-foreground">
          AI
        </span>
      </Link>

      <button className="mb-6 flex w-full items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-2.5 text-left transition hover:bg-sidebar-accent">
        <span className="grid size-8 place-items-center rounded-lg bg-violet-100 text-xs font-bold text-violet-700">
          N
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold">{user.workspaceName}</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">Free workspace</span>
        </span>
        <span aria-hidden="true" className="text-muted-foreground">
          ⌄
        </span>
      </button>

      <nav aria-label="Main navigation" className="flex-1 space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {section.label}
            </p>
            <ul className="space-y-1">
              {section.items.map(({ label, href, icon: Icon }) => {
                const active =
                  pathname === href || (href === '/projects' && pathname.startsWith('/projects/'));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground',
                      )}
                    >
                      <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
                      <span>{label}</span>
                      {label === 'Notifications' && (
                        <span
                          className="ml-auto size-1.5 rounded-full bg-indigo-500"
                          aria-label="Unread notifications"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border pt-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground">
          <CircleHelp aria-hidden="true" size={16} /> Help center
        </button>
        <div className="mt-3 flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-indigo-100 text-[11px] font-semibold text-indigo-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{user.name ?? 'TaskFlow member'}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </div>
  );
}
