import { AuthForm } from '@/components/auth/auth-form';

export default function LoginPage() {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Welcome back</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Log in to your workspace</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Pick up where you and your team left off.
      </p>
      <AuthForm mode="login" />
    </>
  );
}
