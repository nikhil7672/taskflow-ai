export type ApiErrorBody = { error?: { code?: string; message?: string } };
export type ApiProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type ApiTaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELED';
export type ApiTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ApiAuthUser = {
  id: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
};

export type ApiProject = {
  id: string;
  workspaceId: string;
  createdById: string | null;
  name: string;
  slug: string;
  description: string | null;
  status: ApiProjectStatus;
  color: string | null;
  startDate: string | null;
  dueDate: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  members?: Array<{
    role: 'ADMIN' | 'MEMBER' | 'VIEWER';
    addedAt: string;
    user: { id: string; name: string | null; email: string; imageUrl: string | null };
  }>;
};
export type ApiProjectMember = NonNullable<ApiProject['members']>[number];
export type ApiProjectActivity = {
  id: string;
  action: string;
  metadata: unknown;
  createdAt: string;
  actor: { id: string; name: string | null; imageUrl: string | null } | null;
  project: { id: string; name: string } | null;
  task: { id: string; title: string } | null;
};

export type ProjectOverviewItem = Pick<
  ApiProject,
  | 'id'
  | 'workspaceId'
  | 'name'
  | 'slug'
  | 'description'
  | 'status'
  | 'color'
  | 'dueDate'
  | 'updatedAt'
> & {
  taskCount: number;
  completedTaskCount: number;
  progress: number;
  _count: { members: number };
};

export type ApiTask = {
  id: string;
  projectId: string;
  createdById: string | null;
  assigneeId: string | null;
  parentId: string | null;
  title: string;
  description: string | null;
  status: ApiTaskStatus;
  priority: ApiTaskPriority;
  position: string;
  startAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: { id: string; name: string | null; email: string; imageUrl: string | null } | null;
};

export type ApiOverview = {
  projects: ProjectOverviewItem[];
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    completedThisMonth: number;
    memberCount: number;
    projectCount: number;
    activeProjectCount: number;
  };
  upcomingTasks: Array<{
    id: string;
    title: string;
    dueAt: string | null;
    priority: ApiTaskPriority;
    project: { id: string; name: string };
    assignee: { id: string; name: string | null; email: string } | null;
  }>;
  activity: Array<{
    id: string;
    action: string;
    metadata: unknown;
    createdAt: string;
    actor: { id: string; name: string | null } | null;
    project: { id: string; name: string } | null;
    task: { id: string; title: string } | null;
  }>;
};

export type ApiTaskComment = {
  id: string;
  taskId: string;
  content: string;
  editedAt?: string | null;
  createdAt: string;
  author: { id: string; name: string | null; imageUrl: string | null } | null;
};
export type ApiTaskDependency = {
  taskId: string;
  dependsOnId: string;
  createdAt: string;
  dependsOn: {
    id: string;
    title: string;
    status: ApiTaskStatus;
    priority: ApiTaskPriority;
    dueAt: string | null;
  };
};

export type ApiWorkspaceMember = {
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  joinedAt: string;
  user: { id: string; name: string | null; email: string; imageUrl: string | null };
};
