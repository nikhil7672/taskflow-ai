import type { RequestHandler } from 'express';

type Bucket = { count: number; resetsAt: number };

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  consume(key: string, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
    if (this.buckets.size > 10_000) {
      for (const [bucketKey, bucket] of this.buckets) {
        if (bucket.resetsAt <= now) this.buckets.delete(bucketKey);
      }
    }

    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetsAt <= now) {
      this.buckets.set(key, { count: 1, resetsAt: now + this.windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (bucket.count >= this.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetsAt - now) / 1000)),
      };
    }

    bucket.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export function rateLimit(options: {
  limit: number;
  windowMs: number;
  scope: string;
}): RequestHandler {
  const limiter = new FixedWindowRateLimiter(options.limit, options.windowMs);
  return (request, response, next) => {
    const address = request.ip || request.socket.remoteAddress || 'unknown';
    const result = limiter.consume(`${options.scope}:${address}`);
    if (!result.allowed) {
      response.setHeader('Retry-After', result.retryAfterSeconds);
      response.status(429).json({
        error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' },
      });
      return;
    }
    next();
  };
}
