'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function WorkspaceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-5 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
        <AlertTriangle aria-hidden="true" size={21} />
      </span>
      <h1 className="mt-4 text-lg font-semibold">We couldn’t load this view</h1>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        Something unexpected happened. Try again, or return to the overview.
      </p>
      <div className="mt-5 flex gap-2">
        <Button onClick={reset}>
          <RefreshCw aria-hidden="true" /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Go to overview</Link>
        </Button>
      </div>
    </div>
  );
}
