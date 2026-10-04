import { MessageSquareText, MoveRight, Plus, SquareCheck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApiOverview } from '@/lib/api-types';
import { formatRelativeTime, initials } from '@/lib/format';

const activityText: Record<string, { verb: string; icon: typeof Plus }> = {
  'project.created': { verb: 'created project', icon: Plus },
  'project.updated': { verb: 'updated project', icon: MoveRight },
  'project.archived': { verb: 'archived project', icon: MoveRight },
  'project.deleted': { verb: 'deleted project', icon: MoveRight },
  'project.member_added': { verb: 'added a project member to', icon: Plus },
  'project.member_removed': { verb: 'removed a project member from', icon: MoveRight },
  'task.created': { verb: 'created task', icon: Plus },
  'task.updated': { verb: 'updated task', icon: MoveRight },
  'task.status_changed': { verb: 'changed status for', icon: SquareCheck },
  'task.assigned': { verb: 'assigned task', icon: MoveRight },
  'task.comment_added': { verb: 'commented on', icon: MessageSquareText },
  'task.deleted': { verb: 'deleted task', icon: MoveRight },
};

export function ActivityList({ items }: { items: ApiOverview['activity'] }) {
  return (
    <Card className="rounded-2xl border-border/80 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
        <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
        <span className="text-[11px] text-muted-foreground">Latest updates</span>
      </CardHeader>
      <CardContent className="px-5 pb-3">
        {items.length ? (
          <ul className="divide-y divide-border/70">
            {items.map((item) => {
              const detail = activityText[item.action] ?? {
                verb: item.action.replaceAll('.', ' '),
                icon: MoveRight,
              };
              const Icon = detail.icon;
              const subject = item.task?.title ?? item.project?.name ?? 'the workspace';
              const name = item.actor?.name ?? 'A teammate';
              return (
                <li key={item.id} className="flex gap-3 py-3.5 first:pt-2">
                  <Avatar className="mt-0.5 size-8 shrink-0">
                    <AvatarFallback className="bg-muted text-[9px] font-semibold">
                      {initials(item.actor?.name ?? null)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-5">
                      <span className="font-semibold">{name}</span>{' '}
                      <span className="text-muted-foreground">{detail.verb} </span>
                      <span className="font-medium">{subject}</span>
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground/80">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                  <Icon
                    aria-hidden="true"
                    size={14}
                    className="mt-1 shrink-0 text-muted-foreground/70"
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Activity will appear here as your team works.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
