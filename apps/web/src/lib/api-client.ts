import type {
  ApiErrorBody,
  ApiAuthUser,
  ApiProjectActivity,
  ApiProjectMember,
  ApiOverview,
  ApiProject,
  ApiTask,
  ApiTaskComment,
  ApiTaskDependency,
  ApiWorkspaceMember,
  ProjectOverviewItem,
} from './api-types';

const fallbackApiUrl = 'http://localhost:4000/api/v1';

function apiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? fallbackApiUrl).replace(/\/$/u, '');
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function decodeResponse<T>(response: Response): Promise<T> {
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

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      credentials: 'include',
      cache: 'no-store',
      headers: {
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError('Could not reach TaskFlow. Check your connection and try again.', 0);
  }
  return decodeResponse<T>(response);
}

export const api = {
  logout() {
    return apiRequest<void>('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
  },
  login(payload: { email: string; password: string; rememberMe: boolean }) {
    return apiRequest<{ user: ApiAuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  register(payload: { name: string; email: string; password: string }) {
    return apiRequest<{ user: ApiAuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateProfile(name: string) {
    return apiRequest<{ user: ApiAuthUser }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },
  sessions() {
    return apiRequest<{
      sessions: Array<{ id: string; createdAt: string; expiresAt: string; current: boolean }>;
    }>('/auth/sessions');
  },
  revokeSession(sessionId: string) {
    return apiRequest<void>(`/auth/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
  },
  requestPasswordReset(email: string) {
    return apiRequest<void>('/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  confirmPasswordReset(token: string, password: string) {
    return apiRequest<void>('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },
  overview(workspaceId: string) {
    return apiRequest<ApiOverview>(`/workspaces/${encodeURIComponent(workspaceId)}/overview`);
  },
  workspaceMembers(workspaceId: string) {
    return apiRequest<{
      items: ApiWorkspaceMember[];
      pagination: { page: number; pageSize: number; total: number; pages: number };
    }>(`/workspaces/${encodeURIComponent(workspaceId)}/members?pageSize=100`);
  },
  updateWorkspaceMemberRole(
    workspaceId: string,
    userId: string,
    role: 'ADMIN' | 'MEMBER' | 'GUEST',
  ) {
    return apiRequest<{
      member: { userId: string; role: 'ADMIN' | 'MEMBER' | 'GUEST'; updatedAt: string };
    }>(`/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
  removeWorkspaceMember(workspaceId: string, userId: string) {
    return apiRequest<void>(
      `/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}`,
      { method: 'DELETE' },
    );
  },
  addProjectMember(projectId: string, userId: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER') {
    return apiRequest<{
      member: {
        projectId: string;
        userId: string;
        role: ApiProjectMember['role'];
        addedAt: string;
      };
    }>(`/projects/${encodeURIComponent(projectId)}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  },
  removeProjectMember(projectId: string, userId: string) {
    return apiRequest<void>(
      `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`,
      { method: 'DELETE' },
    );
  },
  projectActivity(projectId: string) {
    return apiRequest<{
      items: ApiProjectActivity[];
      pagination: { page: number; pageSize: number; total: number; pages: number };
    }>(`/projects/${encodeURIComponent(projectId)}/activity?pageSize=50`);
  },
  createProject(
    workspaceId: string,
    payload: { name: string; slug: string; description?: string },
  ) {
    return apiRequest<{ project: ApiProject }>(
      `/workspaces/${encodeURIComponent(workspaceId)}/projects`,
      { method: 'POST', body: JSON.stringify(payload) },
    );
  },
  updateProject(
    projectId: string,
    payload: {
      name: string;
      description: string | null;
      status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
      dueDate?: string | null;
    },
  ) {
    return apiRequest<{ project: ApiProject }>(`/projects/${encodeURIComponent(projectId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  project(projectId: string) {
    return apiRequest<{ project: ApiProject }>(`/projects/${encodeURIComponent(projectId)}`);
  },
  tasks(projectId: string, filters: { search?: string; status?: string; pageSize?: number } = {}) {
    const query = new URLSearchParams({ pageSize: String(filters.pageSize ?? 100) });
    if (filters.search) query.set('search', filters.search);
    if (filters.status) query.set('status', filters.status);
    return apiRequest<{
      items: ApiTask[];
      pagination: { page: number; pageSize: number; total: number; pages: number };
    }>(`/projects/${encodeURIComponent(projectId)}/tasks?${query.toString()}`);
  },
  createTask(
    projectId: string,
    payload: { title: string; description?: string; priority: string; dueAt?: string },
  ) {
    return apiRequest<{ task: ApiTask }>(`/projects/${encodeURIComponent(projectId)}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateTask(
    taskId: string,
    payload: Partial<Pick<ApiTask, 'title' | 'description' | 'priority' | 'dueAt' | 'assigneeId'>>,
  ) {
    return apiRequest<{ task: ApiTask }>(`/tasks/${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  updateTaskStatus(taskId: string, status: ApiTask['status']) {
    return apiRequest<{ task: ApiTask }>(`/tasks/${encodeURIComponent(taskId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  assignTask(taskId: string, assigneeId: string | null) {
    return apiRequest<{ task: ApiTask }>(`/tasks/${encodeURIComponent(taskId)}/assignee`, {
      method: 'PUT',
      body: JSON.stringify({ assigneeId }),
    });
  },
  removeTask(taskId: string) {
    return apiRequest<void>(`/tasks/${encodeURIComponent(taskId)}`, { method: 'DELETE' });
  },
  addComment(taskId: string, content: string) {
    return apiRequest<{ comment: ApiTaskComment }>(
      `/tasks/${encodeURIComponent(taskId)}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      },
    );
  },
  comments(taskId: string) {
    return apiRequest<{
      items: ApiTaskComment[];
      pagination: { page: number; pageSize: number; total: number; pages: number };
    }>(`/tasks/${encodeURIComponent(taskId)}/comments?pageSize=100`);
  },
  dependencies(taskId: string) {
    return apiRequest<{ items: ApiTaskDependency[] }>(
      `/tasks/${encodeURIComponent(taskId)}/dependencies`,
    );
  },
  addDependency(taskId: string, dependsOnId: string) {
    return apiRequest<{ dependency: ApiTaskDependency }>(
      `/tasks/${encodeURIComponent(taskId)}/dependencies`,
      { method: 'POST', body: JSON.stringify({ dependsOnId }) },
    );
  },
  removeDependency(taskId: string, dependsOnId: string) {
    return apiRequest<void>(
      `/tasks/${encodeURIComponent(taskId)}/dependencies/${encodeURIComponent(dependsOnId)}`,
      { method: 'DELETE' },
    );
  },
  async listProjectsFromOverview(workspaceId: string) {
    const overview = await this.overview(workspaceId);
    return overview.projects satisfies ProjectOverviewItem[];
  },
};
