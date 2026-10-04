'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api-client';

export function PasswordResetRequestForm() {
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const email = new FormData(event.currentTarget).get('email');
    try {
      await api.requestPasswordReset(String(email ?? ''));
      toast.success('Check your inbox', {
        description: 'If an account matches that email, reset instructions are on the way.',
      });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Could not reach the password reset service. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="reset-email" className="text-sm font-medium">
          Work email
        </label>
        <Input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={320}
          className="h-11 rounded-xl bg-background"
        />
      </div>
      <Button type="submit" disabled={submitting} className="h-11 w-full rounded-xl">
        {submitting ? 'Sending…' : 'Send reset link'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}

export function PasswordResetConfirmForm({ token }: { token: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const password = String(new FormData(event.currentTarget).get('password') ?? '');
    try {
      await api.confirmPasswordReset(token, password);
      toast.success('Password reset', { description: 'Log in with your new password.' });
      router.replace('/login');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Could not reach the password reset service. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <p className="mt-7 text-sm text-destructive">
        This password reset link is incomplete. Request a new link to continue.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="new-password" className="text-sm font-medium">
          New password
        </label>
        <Input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
          className="h-11 rounded-xl bg-background"
        />
        <p className="text-xs text-muted-foreground">Use at least 12 characters.</p>
      </div>
      <Button type="submit" disabled={submitting} className="h-11 w-full rounded-xl">
        {submitting ? 'Saving…' : 'Set new password'}
      </Button>
    </form>
  );
}
