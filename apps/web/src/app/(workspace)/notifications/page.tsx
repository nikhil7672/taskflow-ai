import { PageHeading } from '@/components/shared/page-heading';
import { NotificationsView } from '@/components/notifications/notifications-view';

export default function NotificationsPage() {
  return (
    <div>
      <PageHeading
        eyebrow="Stay in the loop"
        title="Notifications"
        description="A quiet place to catch up on mentions, updates, and invitations."
      />
      <NotificationsView />
    </div>
  );
}
