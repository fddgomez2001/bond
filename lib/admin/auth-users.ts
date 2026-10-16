import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Login details (email, verification, last sign-in) live in auth.users, which
 * only the service role can read. Every caller must already have checked
 * that the requester is an admin (requireRole("admin")).
 */
export type AuthDetails = {
  email: string | null;
  emailConfirmed: boolean;
  lastSignInAt: string | null;
  createdAt: string | null;
};

const toDetails = (user: {
  email?: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  created_at?: string;
}): AuthDetails => ({
  email: user.email ?? null,
  emailConfirmed: Boolean(user.email_confirmed_at),
  lastSignInAt: user.last_sign_in_at ?? null,
  createdAt: user.created_at ?? null,
});

/** Details for a few specific users (one request each). */
export async function authDetailsFor(userIds: string[]) {
  const details = new Map<string, AuthDetails>();
  const admin = createAdminClient();
  if (!admin || userIds.length === 0) return details;
  const results = await Promise.all(userIds.map((id) => admin.auth.admin.getUserById(id)));
  results.forEach(({ data }, index) => {
    if (data.user) details.set(userIds[index], toDetails(data.user));
  });
  return details;
}

/** Details for every user, for the user directory (paged through the Admin API). */
export async function allAuthDetails() {
  const details = new Map<string, AuthDetails>();
  const admin = createAdminClient();
  if (!admin) return { details, available: false };
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 500 });
    if (error) break;
    for (const user of data.users) details.set(user.id, toDetails(user));
    if (data.users.length < 500) break;
  }
  return { details, available: true };
}
