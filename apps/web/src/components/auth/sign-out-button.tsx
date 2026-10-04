'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api-client';

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    try {
      await api.logout();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Could not reach the authentication service.',
      );
      return;
    }
    router.replace('/login');
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={signOut}
      className="h-8 w-full justify-start gap-3 rounded-lg px-3 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
    >
      <LogOut aria-hidden="true" size={16} /> Sign out
    </Button>
  );
}
