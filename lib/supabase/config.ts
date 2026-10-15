import type { CookieOptions } from "@supabase/ssr";

// Both values are safe to expose to the browser: the anon / publishable key
// only grants what Row Level Security allows.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

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
