import { Progress } from '@/components/ui/progress';

export function ProjectProgress({ value, compact = false }: { value: number; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Progress
        value={value}
        aria-label={`Project is ${value}% complete`}
        className={compact ? 'h-1.5' : 'h-2 flex-1'}
      />
      {!compact && (
        <span className="w-9 text-right text-xs font-medium tabular-nums text-muted-foreground">
          {value}%
        </span>
      )}
    </div>
  );
}
