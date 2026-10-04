import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  CircleCheck,
  Layers3,
  MessageSquareText,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Layers3,
    title: 'Projects that stay clear',
    body: 'Bring plans, decisions, and progress into one calm, focused workspace.',
  },
  {
    icon: Sparkles,
    title: 'AI that helps you move',
    body: 'Turn a rough idea into a sensible starting point, with you in control.',
  },
  {
    icon: UsersRound,
    title: 'A team that stays in sync',
    body: 'Make ownership visible and keep the next step easy to find.',
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="TaskFlow AI home">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Layers3 size={19} aria-hidden="true" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight">
            TaskFlow <span className="text-primary">AI</span>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 text-sm text-muted-foreground md:flex"
        >
          <a href="#product" className="transition hover:text-foreground">
            Product
          </a>
          <a href="#features" className="transition hover:text-foreground">
            Features
          </a>
          <a href="#about" className="transition hover:text-foreground">
            About
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="rounded-xl px-4">
            <Link href="/register">
              Get started <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </header>

      <section
        id="product"
        className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-20 lg:grid-cols-[1fr_0.95fr] lg:gap-16"
      >
        <div className="pointer-events-none absolute -left-56 top-0 size-[550px] rounded-full bg-violet-400/10 blur-3xl" />
        <div className="relative z-10 max-w-xl">
          <Badge
            variant="secondary"
            className="mb-6 gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 font-medium text-primary hover:bg-primary/5"
          >
            <Sparkles size={13} aria-hidden="true" /> Less busywork, more good work
          </Badge>
          <h1 className="text-[clamp(3.3rem,6vw,5.8rem)] font-semibold leading-[0.99] tracking-[-0.065em]">
            Work moves better <span className="text-primary">together.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            One thoughtful place for your projects, your people, and the next step. TaskFlow AI
            helps your team turn plans into progress.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-xl px-5 shadow-lg shadow-primary/15">
              <Link href="/register">
                Start with your team <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-xl px-5">
              <Link href="/dashboard">
                Explore the demo <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="mt-7 flex items-center gap-2 text-xs text-muted-foreground">
            <CircleCheck size={15} className="text-emerald-600" aria-hidden="true" />A simple,
            focused workspace for teams of any size
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3.5 py-3 shadow-lg shadow-slate-900/5">
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
              <CircleCheck size={17} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-semibold">Nice progress!</p>
              <p className="text-[10px] text-muted-foreground">5 tasks completed this week</p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[590px] lg:mr-0">
          <div className="absolute -inset-7 rounded-[32px] bg-gradient-to-br from-primary/10 via-transparent to-sky-400/10 blur-xl" />
          <Card className="relative overflow-hidden rounded-[22px] border-border/80 bg-card/95 shadow-2xl shadow-slate-900/10">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-violet-100 text-violet-700">
                  <Layers3 size={16} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold">Website redesign</p>
                  <p className="text-[10px] text-muted-foreground">Northstar Studio</p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              >
                On track
              </Badge>
            </div>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Project progress</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight">72%</p>
                </div>
                <div className="mb-1 flex -space-x-2">
                  {[
                    ['OL', 'bg-violet-100 text-violet-700'],
                    ['JM', 'bg-sky-100 text-sky-700'],
                    ['AK', 'bg-amber-100 text-amber-700'],
                  ].map(([initials, tone]) => (
                    <Avatar key={initials} className="size-8 border-2 border-card">
                      <AvatarFallback className={`text-[9px] font-semibold ${tone}`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  <span className="grid size-8 place-items-center rounded-full border-2 border-card bg-muted text-[9px] font-semibold text-muted-foreground">
                    +2
                  </span>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[72%] rounded-full bg-primary" />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  ['20', 'Complete'],
                  ['6', 'In progress'],
                  ['2', 'To do'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl bg-muted/55 p-3">
                    <p className="text-lg font-semibold">{value}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">Up next</p>
                  <Link
                    href="/projects/website-redesign"
                    className="text-[10px] font-medium text-primary"
                  >
                    View project
                  </Link>
                </div>
                {[
                  {
                    title: 'Finalize homepage direction',
                    person: 'Olivia Lee',
                    initials: 'OL',
                    tone: 'bg-violet-100 text-violet-700',
                    icon: CalendarClock,
                  },
                  {
                    title: 'Review mobile navigation',
                    person: 'Jordan Mitchell',
                    initials: 'JM',
                    tone: 'bg-sky-100 text-sky-700',
                    icon: MessageSquareText,
                  },
                ].map(({ title, person, initials, tone, icon: Icon }) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-xl border border-border/70 p-3"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium">{title}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{person}</p>
                    </div>
                    <Avatar className="size-7">
                      <AvatarFallback className={`text-[9px] font-semibold ${tone}`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/[0.06] px-3.5 py-3 text-[11px] text-primary">
                <Sparkles size={14} aria-hidden="true" /> AI project summary is ready to review
                <Check size={14} className="ml-auto" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        id="features"
        className="border-y border-border/70 bg-muted/30 px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Made for momentum
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything in its right place.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              A little structure gives great ideas room to move.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <Card
                key={title}
                className="rounded-2xl border-border/75 bg-card shadow-none transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-foreground/[0.04]"
              >
                <CardContent className="p-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        id="about"
        className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-5 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:px-8"
      >
        <span>© 2026 TaskFlow AI</span>
        <div className="flex gap-5">
          <Link href="/login" className="hover:text-foreground">
            Log in
          </Link>
          <Link href="/register" className="hover:text-foreground">
            Create account
          </Link>
          <Link href="/dashboard" className="hover:text-foreground">
            Demo workspace
          </Link>
        </div>
      </section>
    </main>
  );
}
