import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icon aria-hidden="true" size={21} />
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
