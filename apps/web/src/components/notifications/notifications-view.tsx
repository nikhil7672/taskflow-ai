'use client';

import {
  Bell,
  CheckCheck,
  Circle,
  MessageSquareText,
  Sparkles,
  SquareCheck,
  UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { notifications as mockNotifications } from '@/lib/mock-data';

type Notification = (typeof mockNotifications)[number];
const filters = ['All', 'Unread'] as const;

function notificationIcon(type: string) {
  if (type === 'mention') return MessageSquareText;
  if (type === 'task') return SquareCheck;
  if (type === 'invite') return UsersRound;
  return Sparkles;
}

export function NotificationsView() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const visible = useMemo(
    () => notifications.filter((item) => filter === 'All' || item.unread),
    [filter, notifications],
  );
  const unreadCount = notifications.filter((item) => item.unread).length;

  function markAllRead() {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
    toast.success('All caught up');
  }

  function toggleRead(id: string) {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: !item.unread } : item)),
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex items-center gap-1 rounded-xl bg-muted/70 p-1"
          aria-label="Notification filter"
        >
          {filters.map((item) => (
            <Button
              key={item}
              variant={filter === item ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className="h-8 rounded-lg px-3 text-xs"
            >
              {item}
              {item === 'Unread' && (
                <span className="ml-1 rounded-full bg-background px-1.5 py-0.5 text-[9px]">
                  {unreadCount}
                </span>
              )}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="h-9 rounded-xl text-xs"
        >
          <CheckCheck size={15} aria-hidden="true" /> Mark all as read
        </Button>
      </div>
      {visible.length ? (
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardContent className="p-0">
            <ul className="divide-y divide-border/70">
              {visible.map((item) => {
                const Icon = notificationIcon(item.type);
                return (
                  <li
                    key={item.id}
                    className={`flex gap-3.5 px-4 py-4 transition-colors sm:px-5 ${item.unread ? 'bg-primary/[0.025]' : ''}`}
                  >
                    <span className="relative shrink-0">
                      <Avatar className="size-10">
                        <AvatarFallback className={`text-[10px] font-semibold ${item.color}`}>
                          {item.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-card bg-card text-muted-foreground">
                        <Icon size={10} aria-hidden="true" />
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-5">
                        <span className="font-semibold">{item.title}</span>{' '}
                        {item.unread && (
                          <Badge className="ml-1.5 h-4 rounded-full px-1.5 text-[8px]">New</Badge>
                        )}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.body}</p>
                      <p className="mt-1.5 text-[10px] text-muted-foreground/80">
                        {item.context} · {item.time}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-between">
                      <span className="sr-only">{item.unread ? 'Unread' : 'Read'}</span>
                      {item.unread ? (
                        <Circle
                          aria-hidden="true"
                          size={9}
                          className="mt-1 fill-primary text-primary"
                        />
                      ) : (
                        <span className="mt-1 size-2" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRead(item.id)}
                        className="h-7 px-2 text-[10px] text-muted-foreground"
                      >
                        {item.unread ? 'Mark read' : 'Mark unread'}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Bell}
          title="You’re all caught up"
          description="New mentions, task updates, and workspace activity will appear here."
          actionLabel="Show all"
          onAction={() => setFilter('All')}
        />
      )}
    </div>
  );
}
