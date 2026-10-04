import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type StatCardProps = {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon: LucideIcon;
  tone: string;
};

export function StatCard({
  label,
  value,
  change,
  positive = true,
  icon: Icon,
  tone,
}: StatCardProps) {
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="rounded-2xl border-border/80 shadow-none transition-shadow hover:shadow-md hover:shadow-foreground/[0.03]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
          <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
            <Icon aria-hidden="true" size={17} />
          </span>
        </div>
        {change && (
          <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
            <TrendIcon
              aria-hidden="true"
              size={13}
              className={positive ? 'text-emerald-600' : 'text-rose-600'}
            />
            <span
              className={
                positive
                  ? 'font-medium text-emerald-700 dark:text-emerald-400'
                  : 'font-medium text-rose-700 dark:text-rose-400'
              }
            >
              {change}
            </span>
            <span>vs last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
