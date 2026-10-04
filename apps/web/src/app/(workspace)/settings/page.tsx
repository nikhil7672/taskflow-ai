import { PageHeading } from '@/components/shared/page-heading';
import { SettingsView } from '@/components/settings/settings-view';
import { getAuthenticatedUser } from '@/lib/auth';

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  return (
    <div>
      <PageHeading
        eyebrow="Your workspace"
        title="Settings"
        description="Make TaskFlow feel right for you and your team."
      />
      <SettingsView profile={{ name: user.name, email: user.email }} />
    </div>
  );
}
