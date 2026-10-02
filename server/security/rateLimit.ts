import type { Request, RequestHandler } from 'express';

export interface FixedWindowRateLimitOptions {
  name: string;
  windowMs: number;
  maxRequests: number;
  now?: () => number;
  key?: (req: Request) => string;
}

interface Bucket {
  startedAt: number;
  count: number;
}

export function createFixedWindowRateLimiter(
  options: FixedWindowRateLimitOptions
): RequestHandler {
  const now = options.now ?? Date.now;
  const buckets = new Map<string, Bucket>();

  return (req, res, next) => {
    const identity =
      options.key?.(req) ??
      req.guestAccess?.guestId ??
      req.ip ??
      req.socket.remoteAddress ??
      'unknown';
    const key = `${options.name}:${identity}`;
    const current = now();
    const existing = buckets.get(key);

    const bucket =
      !existing || current - existing.startedAt >= options.windowMs
        ? { startedAt: current, count: 0 }
        : existing;

    if (bucket.count >= options.maxRequests) {
      const retryAfterMs = Math.max(
        1,
        options.windowMs - (current - bucket.startedAt)
      );
      res.setHeader('Retry-After', String(Math.ceil(retryAfterMs / 1000)));
      res.status(429).json({
        error: 'rate_limit_exceeded',
        limit: options.maxRequests,
        windowMs: options.windowMs,
      });
      return;
    }

    bucket.count += 1;
    buckets.set(key, bucket);
    next();
  };
}
