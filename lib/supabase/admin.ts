import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

/**
 * Service-role client. It bypasses Row Level Security, so it must only run
 * in trusted server code after the request has been validated. The key is
 * read from SUPABASE_SERVICE_ROLE_KEY (never NEXT_PUBLIC_) and the
 * `server-only` import makes the build fail if a Client Component imports it.
 *
 * Returns null when the key is not configured yet.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
