import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole, VendorProfile } from "@/types/database";
import { dashboardPathFor } from "./routes";

export type SessionUser = { id: string; email: string | null };

/**
 * Data Access Layer: the only place pages read the signed-in user.
 * getClaims() verifies the JWT, unlike getSession() which trusts the cookie.
 * Wrapped in React cache() so one request reads it once.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Always a per-request read, even before Supabase keys are configured.
  await connection();
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null };
});

export type Account = {
  user: SessionUser;
  profile: Profile | null;
  /** True when the profile query itself failed (e.g. migrations not run). */
  profileError: boolean;
};

export const getCurrentAccount = cache(async (): Promise<Account | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  // RLS limits this to the caller's own row; the role comes from the
  // database, never from user metadata the client can edit.
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return { user, profile: data ?? null, profileError: Boolean(error) };
});

/** Redirects to /login when signed out, or to the right dashboard when the role differs. */
export async function requireRole(role: UserRole) {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  if (!account.profile) redirect("/dashboard");
  if (account.profile.role !== role) redirect(dashboardPathFor(account.profile.role));
  return { user: account.user, profile: account.profile };
}

/** Whether the signed-in user's email is confirmed (asks the Auth server). */
export async function isEmailConfirmed() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user?.email_confirmed_at);
}

export async function getOwnVendorProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<VendorProfile>();
  return data ?? null;
}
