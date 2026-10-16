import "server-only";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole, VerificationStatus } from "@/types/database";
import { allAuthDetails, authDetailsFor } from "./auth-users";

export type DirectoryUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  contactNumber: string | null;
  role: UserRole;
  joinedAt: string;
  email: string | null;
  emailConfirmed: boolean;
  lastSignInAt: string | null;
  vendorStatus: VerificationStatus | null;
  vendorApplicationId: string | null;
};

export const roleFilters = ["all", "customer", "vendor", "admin"] as const;
export type RoleFilter = (typeof roleFilters)[number];

export function parseRoleFilter(value: unknown): RoleFilter {
  return roleFilters.find((r) => r === value) ?? "all";
}

const PAGE_SIZE = 20;

/** Profiles + login details + vendor status for everyone (admin RLS reads all rows). */
async function loadDirectory() {
  const supabase = await createClient();
  const [{ data: profiles, error }, { data: vendors }, auth] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(2000),
    supabase.from("vendor_profiles").select("id, user_id, business_verification_status"),
    allAuthDetails(),
  ]);
  const vendorByUser = new Map((vendors ?? []).map((v) => [v.user_id as string, v]));

  const users: DirectoryUser[] = ((profiles ?? []) as Profile[]).map((p) => {
    const details = auth.details.get(p.id);
    const vendor = vendorByUser.get(p.id);
    return {
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      contactNumber: p.contact_number,
      role: p.role,
      joinedAt: p.created_at,
      email: details?.email ?? null,
      emailConfirmed: details?.emailConfirmed ?? false,
      lastSignInAt: details?.lastSignInAt ?? null,
      vendorStatus: (vendor?.business_verification_status as VerificationStatus | undefined) ?? null,
      vendorApplicationId: (vendor?.id as string | undefined) ?? null,
    };
  });
  return { users, loadError: Boolean(error), emailsAvailable: auth.available };
}

/** User directory with search (name, email, phone), role filter and paging. */
export async function listUsers({ query, role, page }: { query: string; role: RoleFilter; page: number }) {
  await requireRole("admin");
  const { users, loadError, emailsAvailable } = await loadDirectory();

  const counts = { all: users.length, customer: 0, vendor: 0, admin: 0 } as Record<RoleFilter, number>;
  for (const u of users) counts[u.role] += 1;

  const needle = query.trim().toLowerCase();
  const filtered = users.filter((u) => {
    if (role !== "all" && u.role !== role) return false;
    if (!needle) return true;
    return [u.firstName, u.lastName, `${u.firstName ?? ""} ${u.lastName ?? ""}`, u.email, u.contactNumber]
      .some((field) => field?.toLowerCase().includes(needle));
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pageCount);
  return {
    users: filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    total: filtered.length,
    counts,
    page: current,
    pageCount,
    loadError,
    emailsAvailable,
  };
}

/** Numbers and recent activity for the admin overview page. */
export async function getAdminOverview() {
  await requireRole("admin");
  const supabase = await createClient();
  const [{ data: profiles }, { data: vendors }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name, role, created_at").order("created_at", { ascending: false }).limit(2000),
    supabase.from("vendor_profiles").select("id, user_id, business_verification_status, submitted_at").order("submitted_at", { ascending: true, nullsFirst: false }),
  ]);
  const people = (profiles ?? []) as Pick<Profile, "id" | "first_name" | "last_name" | "role" | "created_at">[];

  const roleCounts = { customer: 0, vendor: 0, admin: 0 } as Record<UserRole, number>;
  for (const p of people) roleCounts[p.role] += 1;

  const statusCounts = { pending_review: 0, needs_resubmission: 0, approved: 0, rejected: 0 } as Record<VerificationStatus, number>;
  for (const v of vendors ?? []) statusCounts[v.business_verification_status as VerificationStatus] += 1;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = people.filter((p) => new Date(p.created_at).getTime() >= weekAgo).length;

  const recent = people.slice(0, 6);
  const nameById = new Map(people.map((p) => [p.id, p]));
  const oldestPending = (vendors ?? [])
    .filter((v) => v.business_verification_status === "pending_review")
    .slice(0, 4)
    .map((v) => ({ id: v.id as string, submittedAt: v.submitted_at as string | null, person: nameById.get(v.user_id as string) ?? null }));

  const emails = await authDetailsFor(recent.map((p) => p.id));

  return {
    totalUsers: people.length,
    roleCounts,
    statusCounts,
    newThisWeek,
    recent: recent.map((p) => ({ ...p, email: emails.get(p.id)?.email ?? null })),
    oldestPending,
  };
}
