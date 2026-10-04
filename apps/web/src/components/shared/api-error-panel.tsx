'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ApiErrorPanel({ message }: { message: string }) {
  const router = useRouter();
  return (
    <div
      role="alert"
      className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 text-center"
    >
      <AlertCircle size={22} className="mb-3 text-destructive" aria-hidden="true" />
      <h2 className="text-sm font-semibold">We couldn’t load this data</h2>
      <p className="mt-1.5 max-w-md text-xs leading-5 text-muted-foreground">{message}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4 rounded-lg"
        onClick={() => router.refresh()}
      >
        <RefreshCw size={14} aria-hidden="true" /> Try again
      </Button>
    </div>
  );
}
