import type { Metadata } from 'next';
import { PasswordResetConfirmForm } from '@/components/auth/password-reset-form';

export const metadata: Metadata = {
  title: 'Reset password | TaskFlow AI',
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        Account recovery
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Choose a new password</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Reset links expire after 30 minutes and can only be used once.
      </p>
      <PasswordResetConfirmForm token={typeof token === 'string' ? token : ''} />
    </>
  );
}
