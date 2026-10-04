import { ArrowLeft, ArrowUpRight, Check, Layers3, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#17152b] p-10 text-white lg:flex xl:p-14">
        <div className="absolute -right-48 top-12 size-[520px] rounded-full bg-violet-600/25 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 size-[520px] rounded-full bg-indigo-500/20 blur-3xl" />
        <Link
          href="/"
          className="relative flex w-fit items-center gap-2.5"
          aria-label="TaskFlow AI home"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-white/10">
            <Layers3 size={18} aria-hidden="true" />
          </span>
          <span className="font-semibold tracking-tight">
            TaskFlow <span className="text-violet-300">AI</span>
          </span>
        </Link>
        <div className="relative max-w-lg">
          <span className="mb-6 grid size-11 place-items-center rounded-2xl bg-white/10 text-violet-200">
            <Sparkles size={21} aria-hidden="true" />
          </span>
          <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] xl:text-5xl">
            Make room for the work that matters.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/65">
            A calmer place to bring your plans, your people, and your progress together.
          </p>
          <div className="mt-8 space-y-3">
            {[
              'One shared view of every project',
              'Clear owners and next steps',
              'AI assistance when you need a head start',
            ].map((item) => (
              <p key={item} className="flex items-center gap-2.5 text-xs text-white/75">
                <Check size={15} className="text-violet-300" aria-hidden="true" />
                {item}
              </p>
            ))}
          </div>
        </div>
        <div className="relative flex items-center justify-between text-xs text-white/45">
          <span>© 2026 TaskFlow AI</span>
          <Link href="/" className="inline-flex items-center gap-1.5 transition hover:text-white">
            Back to home <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </aside>

      <section className="relative flex min-h-screen flex-col px-5 py-5 sm:px-10 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold lg:hidden">
            <Layers3 size={18} className="text-primary" aria-hidden="true" /> TaskFlow AI
          </Link>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          <Link
            href="/"
            className="mb-8 inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft size={14} aria-hidden="true" /> Back to home
          </Link>
          {children}
          <p className="mt-8 text-center text-[11px] leading-5 text-muted-foreground">
            Your account is protected with a private, server-managed session.
          </p>
        </div>
      </section>
    </main>
  );
}
