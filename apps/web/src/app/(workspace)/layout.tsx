import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/workspace-shell';
import { getAuthenticatedUser } from '@/lib/auth';

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');
  return <WorkspaceShell user={user}>{children}</WorkspaceShell>;
}
