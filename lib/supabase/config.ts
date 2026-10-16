import type { CookieOptions } from "@supabase/ssr";

// Both values are safe to expose to the browser: the anon / publishable key
// only grants what Row Level Security allows.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Auth cookies are httpOnly: all Supabase calls happen on the server, so page
 * scripts never need the tokens — and an injected script can't steal them.
 * (If you later use lib/supabase/client.ts in the browser, it won't see the
 * session; read user data through the server instead.)
 */
export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Set when the user logs in with "Keep me signed in" unchecked. Auth cookies
 * are then written without an expiry, so the browser drops them when it
 * closes. Supabase still refreshes tokens normally while the browser is open.
 */
export const SESSION_ONLY_COOKIE = "bond-session-only";

export function withSessionPreference(
  options: CookieOptions,
  sessionOnly: boolean,
): CookieOptions {
  if (!sessionOnly) return options;
  // A cookie being deleted keeps its maxAge of 0 so the deletion still works.
  if (options.maxAge === 0) return options;
  const rest = { ...options };
  delete rest.maxAge;
  delete rest.expires;
  return rest;
}
