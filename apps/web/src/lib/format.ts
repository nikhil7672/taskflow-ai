export function formatDate(value: string | null, fallback = 'No due date') {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatRelativeTime(value: string) {
  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

export function initials(name: string | null, fallback = '?') {
  const value = (name ?? '').trim();
  if (!value) return fallback.slice(0, 2).toUpperCase();
  return value
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function deadlineWarning(value: string | null, completed: boolean) {
  if (!value || completed) return null;
  const delta = new Date(value).getTime() - Date.now();
  if (delta < 0) return 'overdue' as const;
  if (delta < 24 * 60 * 60 * 1000) return 'soon' as const;
  return null;
}
