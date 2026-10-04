'use client';

import {
  ArrowUp,
  Bot,
  Check,
  Copy,
  Lightbulb,
  Plus,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

type Message = { id: number; role: 'assistant' | 'user'; content: string; time: string };
const suggestions = ['Summarize my week', 'What needs attention?', 'Help me plan a project'];

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content:
        'Hi Olivia! I’m your TaskFlow assistant. I can help you get oriented, think through a project, or make a plan from a rough idea. What would you like to work on?',
      time: 'Just now',
    },
  ]);
  const [value, setValue] = useState('');
  const [thinking, setThinking] = useState(false);
  const nextId = useRef(2);

  function send(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || thinking) return;
    const userMessage: Message = {
      id: nextId.current++,
      role: 'user',
      content: trimmed,
      time: 'Just now',
    };
    setMessages((current) => [...current, userMessage]);
    setValue('');
    setThinking(true);
    window.setTimeout(() => {
      const reply = trimmed.toLowerCase().includes('week')
        ? 'Your team completed 68 tasks this month, and the Website redesign is 72% complete. The next deadline is Finalize homepage direction on Oct 4. I’d start with that review, then check in on mobile navigation.'
        : trimmed.toLowerCase().includes('attention')
          ? 'Two things may need a look: Finalize homepage direction is due Oct 4, and Review mobile navigation is waiting for review. The Brand system project is close to its next milestone.'
          : 'A good first step is to write down the outcome, the people involved, and the next milestone. From there, break the work into a few small deliverables and assign a clear owner to each one.';
      setMessages((current) => [
        ...current,
        { id: nextId.current++, role: 'assistant', content: reply, time: 'Just now' },
      ]);
      setThinking(false);
      toast.success('Mock response added', {
        description: 'The AI assistant is not connected to a service.',
      });
    }, 850);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(value);
  }

  return (
    <div className="grid min-h-[calc(100vh-190px)] gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <Card className="flex min-h-[640px] flex-col overflow-hidden rounded-2xl border-border/80 shadow-none">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">TaskFlow assistant</h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                A thoughtful starting point for your work
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setMessages([
                {
                  id: nextId.current++,
                  role: 'assistant',
                  content: 'New conversation started. What would you like help with?',
                  time: 'Just now',
                },
              ])
            }
            aria-label="Start a new conversation"
          >
            <Plus size={17} aria-hidden="true" />
          </Button>
        </div>
        <div
          className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6"
          aria-live="polite"
          aria-label="Conversation"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback
                  className={
                    message.role === 'assistant'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-violet-100 text-violet-700'
                  }
                >
                  {message.role === 'assistant' ? (
                    <Bot size={16} aria-label="Assistant" />
                  ) : (
                    <span className="text-[9px] font-semibold">OL</span>
                  )}
                </AvatarFallback>
              </Avatar>
              <div
                className={`max-w-[88%] sm:max-w-[78%] ${message.role === 'user' ? 'text-right' : ''}`}
              >
                <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">
                  {message.role === 'assistant' ? 'TaskFlow assistant' : 'You'}{' '}
                  <span className="ml-1 font-normal">· {message.time}</span>
                </p>
                <div
                  className={`rounded-2xl px-4 py-3 text-xs leading-6 ${message.role === 'assistant' ? 'rounded-tl-md bg-muted/75 text-foreground' : 'rounded-tr-md bg-primary text-primary-foreground'}`}
                >
                  {message.content}
                </div>
                {message.role === 'assistant' && (
                  <div className="mt-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Copy response"
                      onClick={() => {
                        void navigator.clipboard.writeText(message.content);
                        toast.success('Copied to clipboard');
                      }}
                    >
                      <Copy size={13} aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Helpful response"
                      onClick={() => toast.success('Thanks for the feedback')}
                    >
                      <ThumbsUp size={13} aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Unhelpful response"
                      onClick={() => toast('Feedback noted')}
                    >
                      <ThumbsDown size={13} aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
                <Bot size={15} aria-hidden="true" />
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:120ms]" />
                <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:240ms]" />{' '}
                Thinking
              </span>
            </div>
          )}
        </div>
        {messages.length < 3 && (
          <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-6">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                disabled={thinking}
                onClick={() => send(suggestion)}
                className="h-8 rounded-full text-[10px]"
              >
                <Lightbulb size={12} aria-hidden="true" />
                {suggestion}
              </Button>
            ))}
          </div>
        )}
        <form onSubmit={submit} className="border-t border-border/70 p-3 sm:p-4">
          <div className="relative rounded-2xl border border-border bg-background focus-within:ring-2 focus-within:ring-ring/40">
            <label htmlFor="assistant-prompt" className="sr-only">
              Message the TaskFlow assistant
            </label>
            <Textarea
              id="assistant-prompt"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send(value);
                }
              }}
              placeholder="Ask about your projects or tasks…"
              rows={2}
              className="min-h-[70px] resize-none border-0 pr-14 shadow-none focus-visible:ring-0"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!value.trim() || thinking}
              aria-label="Send message"
              className="absolute bottom-2 right-2 size-8 rounded-lg"
            >
              <ArrowUp size={16} aria-hidden="true" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            <Check size={11} className="mr-1 inline text-emerald-600" aria-hidden="true" />
            Demo responses use local examples only. No prompt is sent to an AI service.
          </p>
        </form>
      </Card>

      <aside className="space-y-4">
        <Card className="rounded-2xl border-border/80 shadow-none">
          <div className="p-5">
            <h2 className="text-xs font-semibold">How I can help</h2>
            <ul className="mt-4 space-y-3 text-[11px] leading-5 text-muted-foreground">
              <li>Summarize progress and open questions</li>
              <li>Turn a goal into an actionable plan</li>
              <li>Find deadlines that need attention</li>
              <li>Help draft a clear project brief</li>
            </ul>
          </div>
        </Card>
        <Card className="rounded-2xl border-primary/15 bg-primary/[0.04] shadow-none">
          <div className="p-5">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles size={15} aria-hidden="true" />
              <h2 className="text-xs font-semibold">A little context</h2>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
              The real assistant will use only the workspace context you choose to share. This page
              currently responds with prepared demo messages.
            </p>
          </div>
        </Card>
      </aside>
    </div>
  );
}
