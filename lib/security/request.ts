import "server-only";

import { siteConfig } from "@/lib/config/site";

type HeaderSource = { get(name: string): string | null };

const LOCAL_HOST = /^(localhost|127\.0\.0\.1)(:\d{1,5})?$/;

/**
 * Base URL for links in auth emails. On your own machine it follows the
 * port the app is actually running on (3000 for `next dev`, 8713 for
 * `next start -p 8713`, …). Anywhere else it uses the configured site URL,
 * so a forged Host header can't point emails at another domain.
 */
export function appOrigin(headers: HeaderSource) {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (host && LOCAL_HOST.test(host)) return `http://${host}`;
  return siteConfig.url;
}

/** Best-effort client IP for rate-limit keys (Vercel sets x-forwarded-for). */
export function getClientIp(headers: HeaderSource) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/**
 * Rejects cross-site POSTs to Route Handlers. Server Actions get this check
 * from Next.js automatically; Route Handlers do not.
 */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Only allows relative in-app paths for post-login redirects, so a crafted
 * `?next=https://evil.example` cannot bounce users off-site.
 */
export function safeNextPath(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
