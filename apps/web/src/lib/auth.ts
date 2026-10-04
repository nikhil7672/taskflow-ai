import { cache } from 'react';
import { serverApiRequest } from './server-api';

export type AuthenticatedUser = {
  id: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
  createdAt: string;
  memberships: Array<{
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
    workspace: { id: string; name: string; slug: string };
  }>;
};

export const getAuthenticatedUser = cache(async (): Promise<AuthenticatedUser | null> => {
  try {
    const data = await serverApiRequest<{ user: AuthenticatedUser }>('/auth/me');
    return data.user;
  } catch {
    return null;
  }
});

export const getCurrentWorkspace = cache(async () => {
  const user = await getAuthenticatedUser();
  return user?.memberships[0]?.workspace ?? null;
});
