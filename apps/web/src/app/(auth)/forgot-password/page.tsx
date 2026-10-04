import { PasswordResetRequestForm } from '@/components/auth/password-reset-form';

export default function ForgotPasswordPage() {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        Account recovery
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Reset your password</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        We’ll email a one-time reset link if an account matches that address.
      </p>
      <PasswordResetRequestForm />
    </>
  );
}
