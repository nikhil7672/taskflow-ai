'use client';

import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api-client';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const isRegister = mode === 'register';
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const formElement = event.currentTarget;
    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      ...(isRegister ? { name: String(formData.get('name') ?? '') } : {}),
      ...(!isRegister ? { rememberMe: formData.get('rememberMe') === 'on' } : {}),
    };

    try {
      if (isRegister) {
        await api.register({
          name: payload.name ?? '',
          email: payload.email,
          password: payload.password,
        });
      } else {
        await api.login({
          email: payload.email,
          password: payload.password,
          rememberMe: payload.rememberMe ?? false,
        });
      }
      router.replace('/dashboard');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Unable to sign in. Please try again.';
      toast.error(message);
      formElement.focus();
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
      {isRegister && (
        <div className="space-y-1.5">
          <label htmlFor="full-name" className="text-sm font-medium">
            Full name
          </label>
          <Input
            id="full-name"
            name="name"
            autoComplete="name"
            placeholder="Your name"
            required
            className="h-11 rounded-xl bg-background"
          />
        </div>
      )}
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Work email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          className="h-11 rounded-xl bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          {!isRegister && (
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          )}
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            placeholder={isRegister ? 'At least 12 characters' : 'Your password'}
            minLength={isRegister ? 12 : 1}
            required
            className="h-11 rounded-xl bg-background pr-11"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? (
              <EyeOff size={17} aria-hidden="true" />
            ) : (
              <Eye size={17} aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
      {isRegister ? (
        <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-xs leading-5 text-muted-foreground">
          <Checkbox required className="mt-0.5" />
          <span>
            I agree to the{' '}
            <Link
              href="/"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>
      ) : (
        <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-xs text-muted-foreground">
          <Checkbox id="remember-me" name="rememberMe" value="on" /> Keep me signed in
        </label>
      )}
      <Button
        type="submit"
        disabled={submitting}
        className="h-11 w-full rounded-xl text-sm font-semibold"
      >
        {submitting && <LoaderCircle className="animate-spin" aria-hidden="true" size={16} />}
        {submitting ? 'Please wait…' : isRegister ? 'Create your account' : 'Log in to TaskFlow'}
      </Button>
      <p className="pt-1 text-center text-sm text-muted-foreground">
        {isRegister ? 'Already have an account?' : 'New to TaskFlow?'}{' '}
        <Link
          href={isRegister ? '/login' : '/register'}
          className="font-semibold text-primary hover:underline"
        >
          {isRegister ? 'Log in' : 'Create an account'}
        </Link>
      </p>
    </form>
  );
}
