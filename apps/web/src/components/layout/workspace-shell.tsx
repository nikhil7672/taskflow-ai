'use client';

import { Bell, Menu, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/projects': 'Projects',
  '/team': 'Team',
  '/assistant': 'AI assistant',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

type WorkspaceUser = {
  name: string | null;
  email: string;
  memberships: Array<{ workspace: { name: string } }>;
};

export function WorkspaceShell({ children, user }: { children: ReactNode; user: WorkspaceUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = pathname.includes('/board')
    ? 'Task board'
    : pathname.startsWith('/projects/')
      ? 'Project details'
      : (routeTitles[pathname] ?? 'Workspace');
  const sidebarUser = {
    name: user.name,
    email: user.email,
    workspaceName: user.memberships[0]?.workspace.name ?? 'Your workspace',
  };
  const initials = (user.name ?? user.email)
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-sidebar-border bg-sidebar lg:block">
        <AppSidebar user={sidebarUser} />
      </aside>

      <div className="min-h-screen lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetTitle className="sr-only">TaskFlow navigation</SheetTitle>
                <AppSidebar user={sidebarUser} onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <p className="truncate text-sm font-semibold">{title}</p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <label className="relative hidden md:block">
              <Search
                aria-hidden="true"
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                aria-label="Search TaskFlow"
                placeholder="Search anything..."
                className="h-9 w-[205px] border-transparent bg-muted/70 pl-9 pr-14 text-xs focus-visible:border-ring lg:w-[240px]"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ⌘ K
              </kbd>
            </label>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative rounded-xl"
              aria-label="View notifications"
            >
              <Link href="/notifications">
                <Bell aria-hidden="true" size={18} />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-indigo-500" />
              </Link>
            </Button>
            <ThemeToggle />
            <Avatar className="ml-1 size-8 sm:hidden">
              <AvatarFallback className="bg-indigo-100 text-xs font-semibold text-indigo-700">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-7 sm:py-9 xl:px-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
