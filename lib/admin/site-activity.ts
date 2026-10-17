import "server-only";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";
import { allAuthDetails } from "./auth-users";

/** Data for the admin "Site Visitors" page (admins can read these tables; nobody else). */

export type ActivityRange = "today" | "7d" | "30d" | "90d";

export const activityRanges: { value: ActivityRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export const parseActivityRange = (v: unknown): ActivityRange => activityRanges.find((r) => r.value === v)?.value ?? "7d";

type DeviceType = "phone" | "tablet" | "desktop" | "unknown";

type VisitRow = {
  visitor_id: string;
  user_id: string | null;
  host: string | null;
  path: string;
  referrer_host: string | null;
  device_type: DeviceType;
  device_model: string | null;
  os: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
  created_at: string;
};

type AttemptRow = Omit<VisitRow, "path" | "referrer_host"> & {
  id: number;
  email: string;
  succeeded: boolean;
  reason: "wrong_password" | "email_not_verified" | "too_many_attempts" | "error" | null;
  visitor_id: string | null;
};

export type Account = { name: string; email: string | null; role: UserRole | null };

export type VisitorSummary = {
  visitorId: string;
  deviceType: DeviceType;
  deviceModel: string | null;
  os: string | null;
  browser: string | null;
  location: string | null;
  host: string | null;
  account: Account | null;
  visits: number;
  pageViews: number;
  firstSeen: string;
  lastSeen: string;
  lastPath: string;
};

export type Breakdown = { label: string; count: number }[];

/** A new visit starts after 30 minutes without opening a page. */
const SESSION_GAP_MS = 30 * 60 * 1000;
const MAX_ROWS = 20000;
const isLocalHost = (host: string | null) => !host || /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);

function since(range: ActivityRange, now: number) {
  if (range === "today") {
    // Midnight in the Philippines (UTC+8).
    const ph = new Date(now + 8 * 3600_000);
    ph.setUTCHours(0, 0, 0, 0);
    return new Date(ph.getTime() - 8 * 3600_000);
  }
  const days = { "7d": 7, "30d": 30, "90d": 90 }[range];
  return new Date(now - days * 86400_000);
}

function tally(values: (string | null)[], limit = 6): Breakdown {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

const placeOf = (r: { city: string | null; country: string | null }) =>
  [r.city, r.country].filter(Boolean).join(", ") || null;
const withoutVersion = (value: string | null) => value?.replace(/\s+\d+(\.\d+)*$/, "") ?? null;

export async function getSiteActivity({ range, includeLocal }: { range: ActivityRange; includeLocal: boolean }) {
  await requireRole("admin");
  const supabase = await createClient();
  const now = Date.now();
  const from = since(range, now).toISOString();

  const [visitsResult, attemptsResult] = await Promise.all([
    supabase
      .from("site_visits")
      .select("visitor_id, user_id, host, path, referrer_host, device_type, device_model, os, browser, country, city, created_at")
      .gte("created_at", from)
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS),
    supabase.from("sign_in_attempts").select("*").gte("created_at", from).order("created_at", { ascending: false }).limit(300),
  ]);

  const setupNeeded = Boolean(visitsResult.error);
  const visits = ((visitsResult.data ?? []) as VisitRow[]).filter((v) => includeLocal || !isLocalHost(v.host));
  const attempts = ((attemptsResult.data ?? []) as AttemptRow[]).filter((a) => includeLocal || !isLocalHost(a.host));
  const localHidden = !includeLocal && ((visitsResult.data ?? []) as VisitRow[]).some((v) => isLocalHost(v.host));

  // Group page views by browser (visitor ID), oldest first, splitting into visits.
  type Working = Omit<VisitorSummary, "account"> & { userId: string | null; lastAt: number };
  const byVisitor = new Map<string, Working>();
  for (const row of [...visits].reverse()) {
    const at = new Date(row.created_at).getTime();
    const current = byVisitor.get(row.visitor_id);
    if (!current) {
      byVisitor.set(row.visitor_id, {
        visitorId: row.visitor_id,
        deviceType: row.device_type,
        deviceModel: row.device_model,
        os: row.os,
        browser: row.browser,
        location: placeOf(row),
        host: row.host,
        userId: row.user_id,
        visits: 1,
        pageViews: 1,
        firstSeen: row.created_at,
        lastSeen: row.created_at,
        lastPath: row.path,
        lastAt: at,
      });
      continue;
    }
    if (at - current.lastAt > SESSION_GAP_MS) current.visits += 1;
    current.pageViews += 1;
    current.lastSeen = row.created_at;
    current.lastPath = row.path;
    current.lastAt = at;
    // Latest details win (a phone model may only arrive with client hints later).
    current.deviceModel = row.device_model ?? current.deviceModel;
    current.os = row.os ?? current.os;
    current.browser = row.browser ?? current.browser;
    current.location = placeOf(row) ?? current.location;
    if (row.user_id) current.userId = row.user_id;
  }

  // Names, roles and emails for signed-in visitors and successful sign-ins.
  const userIds = [
    ...new Set([
      ...[...byVisitor.values()].map((v) => v.userId).filter(Boolean),
      ...attempts.map((a) => a.user_id).filter(Boolean),
    ] as string[]),
  ];
  const accounts = new Map<string, Account>();
  if (userIds.length) {
    const [{ data: profiles }, auth] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, role").in("id", userIds.slice(0, 500)),
      allAuthDetails(),
    ]);
    for (const p of (profiles ?? []) as { id: string; first_name: string | null; last_name: string | null; role: UserRole }[]) {
      accounts.set(p.id, {
        name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "No name",
        email: auth.details.get(p.id)?.email ?? null,
        role: p.role,
      });
    }
  }

  const visitors: VisitorSummary[] = [...byVisitor.values()]
    .map((v) => ({
      visitorId: v.visitorId,
      deviceType: v.deviceType,
      deviceModel: v.deviceModel,
      os: v.os,
      browser: v.browser,
      location: v.location,
      host: v.host,
      account: v.userId ? (accounts.get(v.userId) ?? { name: "Deleted account", email: null, role: null }) : null,
      visits: v.visits,
      pageViews: v.pageViews,
      firstSeen: v.firstSeen,
      lastSeen: v.lastSeen,
      lastPath: v.lastPath,
    }))
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));

  const totalVisits = visitors.reduce((sum, v) => sum + v.visits, 0);
  const phones = visitors.filter((v) => v.deviceType === "phone").length;

  return {
    now,
    setupNeeded,
    capped: (visitsResult.data?.length ?? 0) >= MAX_ROWS,
    localHidden,
    totals: {
      visitors: visitors.length,
      visits: totalVisits,
      pageViews: visits.length,
      signedIn: visitors.filter((v) => v.account).length,
      phones,
      attempts: attempts.length,
      failedAttempts: attempts.filter((a) => !a.succeeded).length,
    },
    breakdowns: {
      devices: tally(visitors.map((v) => ({ phone: "Phone", tablet: "Tablet", desktop: "Computer", unknown: "Unknown" })[v.deviceType]), 4),
      models: tally(visitors.map((v) => v.deviceModel ?? (v.deviceType === "desktop" ? withoutVersion(v.os) : null))),
      browsers: tally(visitors.map((v) => withoutVersion(v.browser))),
      systems: tally(visitors.map((v) => withoutVersion(v.os))),
      pages: tally(visits.map((v) => v.path), 8),
      places: tally(visitors.map((v) => v.location)),
      referrers: tally(visits.filter((v) => v.referrer_host).map((v) => v.referrer_host), 5),
    },
    visitors: visitors.slice(0, 150),
    attempts: attempts.slice(0, 100).map((a) => ({
      id: a.id,
      email: a.email,
      succeeded: a.succeeded,
      reason: a.reason,
      at: a.created_at,
      deviceType: a.device_type,
      device: a.device_model ?? withoutVersion(a.os),
      browser: a.browser,
      location: placeOf(a),
      account: a.user_id ? (accounts.get(a.user_id) ?? null) : null,
    })),
  };
}

export type SiteActivity = Awaited<ReturnType<typeof getSiteActivity>>;
