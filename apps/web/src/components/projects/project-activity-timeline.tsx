import { Activity, Check, CirclePlus, MessageSquareText, UserRoundPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApiProjectActivity } from '@/lib/api-types';
import { formatRelativeTime } from '@/lib/format';

const actionLabels: Record<string, string> = {
  'task.created': 'created a task',
  'task.updated': 'updated a task',
  'task.status_changed': 'changed task status',
  'task.assigned': 'changed a task assignment',
  'task.deleted': 'deleted a task',
  'task.comment_added': 'commented on a task',
  'task.dependency_added': 'added a task dependency',
  'task.dependency_removed': 'removed a task dependency',
  'project.created': 'created the project',
  'project.updated': 'updated project details',
  'project.member_added': 'added a project member',
  'project.member_removed': 'removed a project member',
};

export function ProjectActivityTimeline({
  items,
  failed = false,
}: {
  items: ApiProjectActivity[];
  failed?: boolean;
}) {
  return (
    <Card className="rounded-2xl border-border/80 shadow-none">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity size={15} aria-hidden="true" /> Project activity
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {failed ? (
          <p role="status" className="py-5 text-center text-xs text-muted-foreground">
            Activity could not be loaded.
          </p>
        ) : items.length === 0 ? (
          <p className="py-5 text-center text-xs text-muted-foreground">
            Project updates will appear here.
          </p>
        ) : (
          <ol className="space-y-4">
            {items.slice(0, 8).map((item) => {
              const icon =
                item.action === 'task.comment_added'
                  ? MessageSquareText
                  : item.action.includes('member_')
                    ? UserRoundPlus
                    : item.action === 'task.created'
                      ? CirclePlus
                      : Check;
              const Icon = icon;
              return (
                <li key={item.id} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Icon size={13} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-5">
                      <span className="font-medium">{item.actor?.name || 'A teammate'}</span>{' '}
                      {actionLabels[item.action] ?? 'updated the project'}
                      {item.task ? (
                        <>
                          {' '}
                          · <span className="font-medium">{item.task.title}</span>
                        </>
                      ) : null}
                    </p>
                    <time
                      dateTime={item.createdAt}
                      className="mt-0.5 block text-[10px] text-muted-foreground"
                    >
                      {formatRelativeTime(item.createdAt)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
