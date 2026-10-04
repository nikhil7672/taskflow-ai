export type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
  progress: number;
  due: string;
  tasks: number;
  complete: number;
  members: string[];
  lead: string;
};

export type Task = {
  id: string;
  title: string;
  projectId: string;
  project: string;
  status: 'Backlog' | 'To do' | 'In progress' | 'In review' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  due: string;
  assignee: string;
  initials: string;
  color: string;
};

export const projects: Project[] = [
  {
    id: 'website-redesign',
    name: 'Website redesign',
    description: 'A thoughtful refresh of the marketing site and product story.',
    color: 'bg-violet-500',
    progress: 72,
    due: 'Oct 18, 2026',
    tasks: 28,
    complete: 20,
    members: ['OL', 'JM', 'AK', 'TW'],
    lead: 'Olivia Lee',
  },
  {
    id: 'mobile-app',
    name: 'Mobile app launch',
    description: 'Bring the core TaskFlow experience to iOS and Android.',
    color: 'bg-sky-500',
    progress: 48,
    due: 'Nov 02, 2026',
    tasks: 42,
    complete: 20,
    members: ['JM', 'SK', 'MC'],
    lead: 'Jordan Mitchell',
  },
  {
    id: 'brand-system',
    name: 'Brand system',
    description: 'A flexible visual language for every customer touchpoint.',
    color: 'bg-amber-500',
    progress: 86,
    due: 'Oct 12, 2026',
    tasks: 16,
    complete: 14,
    members: ['AK', 'OL', 'MC'],
    lead: 'Avery Kim',
  },
  {
    id: 'growth-q4',
    name: 'Q4 growth campaign',
    description: 'Coordinate experiments and content for the next quarter.',
    color: 'bg-emerald-500',
    progress: 31,
    due: 'Nov 15, 2026',
    tasks: 35,
    complete: 11,
    members: ['TW', 'SK', 'OL'],
    lead: 'Taylor Wu',
  },
];

export const tasks: Task[] = [
  {
    id: 'T-124',
    title: 'Finalize homepage direction',
    projectId: 'website-redesign',
    project: 'Website redesign',
    status: 'In progress',
    priority: 'High',
    due: 'Oct 04',
    assignee: 'Olivia Lee',
    initials: 'OL',
    color: 'bg-violet-100 text-violet-700',
  },
  {
    id: 'T-125',
    title: 'Review mobile navigation',
    projectId: 'mobile-app',
    project: 'Mobile app launch',
    status: 'In review',
    priority: 'Medium',
    due: 'Oct 05',
    assignee: 'Jordan Mitchell',
    initials: 'JM',
    color: 'bg-sky-100 text-sky-700',
  },
  {
    id: 'T-126',
    title: 'Prepare icon exports',
    projectId: 'brand-system',
    project: 'Brand system',
    status: 'To do',
    priority: 'Low',
    due: 'Oct 07',
    assignee: 'Avery Kim',
    initials: 'AK',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'T-127',
    title: 'Share launch email draft',
    projectId: 'growth-q4',
    project: 'Q4 growth campaign',
    status: 'Backlog',
    priority: 'Medium',
    due: 'Oct 09',
    assignee: 'Taylor Wu',
    initials: 'TW',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'T-128',
    title: 'Map account setup flow',
    projectId: 'mobile-app',
    project: 'Mobile app launch',
    status: 'In progress',
    priority: 'High',
    due: 'Oct 08',
    assignee: 'Morgan Chen',
    initials: 'MC',
    color: 'bg-rose-100 text-rose-700',
  },
  {
    id: 'T-129',
    title: 'Document color tokens',
    projectId: 'brand-system',
    project: 'Brand system',
    status: 'Done',
    priority: 'Low',
    due: 'Oct 02',
    assignee: 'Avery Kim',
    initials: 'AK',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'T-130',
    title: 'Audit customer feedback',
    projectId: 'website-redesign',
    project: 'Website redesign',
    status: 'To do',
    priority: 'High',
    due: 'Oct 10',
    assignee: 'Sam Kapoor',
    initials: 'SK',
    color: 'bg-indigo-100 text-indigo-700',
  },
  {
    id: 'T-131',
    title: 'Outline campaign brief',
    projectId: 'growth-q4',
    project: 'Q4 growth campaign',
    status: 'In progress',
    priority: 'Medium',
    due: 'Oct 11',
    assignee: 'Taylor Wu',
    initials: 'TW',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'T-132',
    title: 'Check responsive states',
    projectId: 'website-redesign',
    project: 'Website redesign',
    status: 'Done',
    priority: 'Medium',
    due: 'Oct 01',
    assignee: 'Jordan Mitchell',
    initials: 'JM',
    color: 'bg-sky-100 text-sky-700',
  },
  {
    id: 'T-133',
    title: 'Test onboarding prototype',
    projectId: 'mobile-app',
    project: 'Mobile app launch',
    status: 'Backlog',
    priority: 'Low',
    due: 'Oct 14',
    assignee: 'Sam Kapoor',
    initials: 'SK',
    color: 'bg-indigo-100 text-indigo-700',
  },
];

export const activity = [
  {
    initials: 'JM',
    color: 'bg-sky-100 text-sky-700',
    name: 'Jordan Mitchell',
    action: 'moved',
    subject: 'Review mobile navigation',
    detail: 'to In review',
    time: '12 min ago',
  },
  {
    initials: 'AK',
    color: 'bg-amber-100 text-amber-700',
    name: 'Avery Kim',
    action: 'completed',
    subject: 'Document color tokens',
    detail: 'in Brand system',
    time: '48 min ago',
  },
  {
    initials: 'MC',
    color: 'bg-rose-100 text-rose-700',
    name: 'Morgan Chen',
    action: 'commented on',
    subject: 'Map account setup flow',
    detail: '“The new flow is ready for a look.”',
    time: '2 hours ago',
  },
  {
    initials: 'TW',
    color: 'bg-emerald-100 text-emerald-700',
    name: 'Taylor Wu',
    action: 'created',
    subject: 'Q4 campaign outline',
    detail: 'in Q4 growth campaign',
    time: '4 hours ago',
  },
];

export const teamMembers = [
  {
    name: 'Olivia Lee',
    email: 'olivia@northstar.team',
    role: 'Admin',
    initials: 'OL',
    color: 'bg-violet-100 text-violet-700',
    status: 'Active',
  },
  {
    name: 'Jordan Mitchell',
    email: 'jordan@northstar.team',
    role: 'Member',
    initials: 'JM',
    color: 'bg-sky-100 text-sky-700',
    status: 'Active',
  },
  {
    name: 'Avery Kim',
    email: 'avery@northstar.team',
    role: 'Member',
    initials: 'AK',
    color: 'bg-amber-100 text-amber-700',
    status: 'Active',
  },
  {
    name: 'Taylor Wu',
    email: 'taylor@northstar.team',
    role: 'Member',
    initials: 'TW',
    color: 'bg-emerald-100 text-emerald-700',
    status: 'Active',
  },
  {
    name: 'Morgan Chen',
    email: 'morgan@northstar.team',
    role: 'Member',
    initials: 'MC',
    color: 'bg-rose-100 text-rose-700',
    status: 'Invited',
  },
];

export const notifications = [
  {
    id: 'n1',
    type: 'mention',
    title: 'Jordan mentioned you in a comment',
    body: '“Olivia, could you take a look at the new navigation?”',
    context: 'Review mobile navigation · Mobile app launch',
    time: '12 min ago',
    initials: 'JM',
    color: 'bg-sky-100 text-sky-700',
    unread: true,
  },
  {
    id: 'n2',
    type: 'task',
    title: 'A task is due tomorrow',
    body: 'Finalize homepage direction is coming up.',
    context: 'Website redesign',
    time: '1 hour ago',
    initials: 'TF',
    color: 'bg-indigo-100 text-indigo-700',
    unread: true,
  },
  {
    id: 'n3',
    type: 'project',
    title: 'Avery completed a task',
    body: 'Document color tokens was marked complete.',
    context: 'Brand system',
    time: '3 hours ago',
    initials: 'AK',
    color: 'bg-amber-100 text-amber-700',
    unread: false,
  },
  {
    id: 'n4',
    type: 'invite',
    title: 'Morgan accepted your invitation',
    body: 'Morgan Chen is now part of the workspace.',
    context: 'Northstar Studio',
    time: 'Yesterday',
    initials: 'MC',
    color: 'bg-rose-100 text-rose-700',
    unread: false,
  },
];
