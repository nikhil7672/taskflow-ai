import { AuthForm } from '@/components/auth/auth-form';

export default function RegisterPage() {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Get started</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Create your account</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Start bringing your team’s work into focus.
      </p>
      <AuthForm mode="register" />
    </>
  );
}
