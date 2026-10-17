import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/utils";
import { isBot, parseUserAgent, type ClientHints, type DeviceInfo } from "./user-agent";

/**
 * Writes page visits and sign-in attempts for the admin "Site Visitors"
 * page. Uses the service role (visitors can't write these tables), never
 * stores raw IP addresses, and fails silently: analytics must never break
 * a page or a login (e.g. before the migration has been run).
 */

type HeaderSource = { get(name: string): string | null };

/** Random ID that lets repeat visits from the same browser be counted. */
export const VISITOR_COOKIE = "bond-vid";

export const visitorCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export const validVisitorId = (value: string | undefined) => (value && isUuid(value) ? value : null);

export type RequestDevice = DeviceInfo & {
  bot: boolean;
  host: string | null;
  country: string | null;
  city: string | null;
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** Approximate location from Vercel's edge headers (absent when running locally). */
function locationOf(headers: HeaderSource) {
  const code = headers.get("x-vercel-ip-country");
  let country: string | null = null;
  if (code && /^[A-Z]{2}$/.test(code)) {
    try {
      country = regionNames.of(code) ?? code;
    } catch {
      country = code;
    }
  }
  let city: string | null = null;
  const rawCity = headers.get("x-vercel-ip-city");
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity);
    } catch {
      city = rawCity;
    }
  }
  return { country: country?.slice(0, 80) ?? null, city: city?.slice(0, 80) ?? null };
}

export function describeRequest(headers: HeaderSource, hints: ClientHints = {}): RequestDevice {
  const ua = headers.get("user-agent") ?? "";
  const host = (headers.get("x-forwarded-host") ?? headers.get("host"))?.slice(0, 120) ?? null;
  return { bot: isBot(ua), host, ...parseUserAgent(ua, hints), ...locationOf(headers) };
}

const deviceColumns = (d: RequestDevice) => ({
  host: d.host,
  device_type: d.deviceType,
  device_model: d.deviceModel,
  os: d.os,
  browser: d.browser,
  country: d.country,
  city: d.city,
});

export async function recordVisit(visit: {
  visitorId: string;
  userId: string | null;
  path: string;
  referrerHost: string | null;
  device: RequestDevice;
}) {
  const admin = createAdminClient();
  if (!admin) return;
  try {
    await admin.from("site_visits").insert({
      visitor_id: visit.visitorId,
      user_id: visit.userId,
      path: visit.path,
      referrer_host: visit.referrerHost,
      ...deviceColumns(visit.device),
    });
    // Now and then, drop history older than 90 days.
    if (Math.random() < 0.005) await admin.rpc("prune_site_activity");
  } catch {
    // Never let analytics break a page.
  }
}

export type SignInFailure = "wrong_password" | "email_not_verified" | "too_many_attempts" | "error";

export async function recordSignInAttempt(attempt: {
  email: string;
  succeeded: boolean;
  reason: SignInFailure | null;
  userId: string | null;
  visitorId: string | null;
  device: RequestDevice;
}) {
  const admin = createAdminClient();
  if (!admin) return;
  try {
    await admin.from("sign_in_attempts").insert({
      email: attempt.email.slice(0, 254),
      succeeded: attempt.succeeded,
      reason: attempt.reason,
      user_id: attempt.userId,
      visitor_id: attempt.visitorId,
      ...deviceColumns(attempt.device),
    });
  } catch {
    // Never let analytics break a login.
  }
}
