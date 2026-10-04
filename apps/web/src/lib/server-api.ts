import { cookies } from 'next/headers';
import { ApiError } from './api-client';
import type { ApiErrorBody } from './api-types';

const sessionCookieName = 'taskflow_session';

export async function serverApiRequest<T>(path: string): Promise<T> {
  const session = (await cookies()).get(sessionCookieName)?.value;
  if (!session) throw new ApiError('Sign in required', 401, 'UNAUTHENTICATED');
  const baseUrl = (process.env.API_INTERNAL_BASE_URL ?? 'http://localhost:4000/api/v1').replace(
    /\/$/u,
    '',
  );
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      headers: { cookie: `${sessionCookieName}=${session}` },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Could not reach TaskFlow. Check your connection and try again.', 0);
  }
  if (response.status === 204) return undefined as T;
  const body = (await response.json().catch(() => null)) as (ApiErrorBody & T) | null;
  if (!response.ok) {
    throw new ApiError(
      body?.error?.message ?? 'The request could not be completed. Please try again.',
      response.status,
      body?.error?.code,
    );
  }
  if (body === null)
    throw new ApiError('The server returned an invalid response.', response.status);
  return body as T;
}

export async function captureServerApiResult<T>(request: Promise<T>) {
  try {
    return { data: await request } as const;
  } catch (error) {
    return { error } as const;
  }
}
