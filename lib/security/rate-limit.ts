import "server-only";

/**
 * Small fixed-window rate limiter kept in memory.
 *
 * On Vercel each serverless instance has its own memory, so this is a
 * best-effort extra layer — Supabase Auth's own server-side limits (sign-in
 * attempts, OTP verification, emails per hour) remain the real enforcement.
 * For a shared limit across instances, swap the Map for Redis/Upstash.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

export type RateLimitRule = { limit: number; windowMs: number };

export const rateLimits = {
  login: { limit: 10, windowMs: 10 * 60_000 },
  register: { limit: 5, windowMs: 60 * 60_000 },
  verifyOtp: { limit: 6, windowMs: 10 * 60_000 },
  resendOtp: { limit: 4, windowMs: 15 * 60_000 },
  passwordReset: { limit: 4, windowMs: 15 * 60_000 },
} satisfies Record<string, RateLimitRule>;

export function checkRateLimit(key: string, rule: RateLimitRule) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_KEYS) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
      if (buckets.size >= MAX_KEYS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= rule.limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Checks several keys (e.g. per-IP and per-email) and fails if any is over. */
export function checkRateLimits(keys: string[], rule: RateLimitRule) {
  let retryAfterSeconds = 0;
  let allowed = true;
  for (const key of keys) {
    const result = checkRateLimit(key, rule);
    if (!result.allowed) {
      allowed = false;
      retryAfterSeconds = Math.max(retryAfterSeconds, result.retryAfterSeconds);
    }
  }
  return { allowed, retryAfterSeconds };
}

export function tooManyAttemptsMessage(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Too many attempts. Please wait ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`;
}
