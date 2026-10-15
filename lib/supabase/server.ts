import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  SESSION_ONLY_COOKIE,
  supabaseAnonKey,
  supabaseUrl,
  withSessionPreference,
} from "./config";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Create a new one per request — never share it between requests.
 *
 * `sessionOnly` overrides the stored "keep me signed in" preference; it is
 * only passed by the login action, before that preference cookie exists.
 */
export async function createClient(options: { sessionOnly?: boolean } = {}) {
  const cookieStore = await cookies();
  const sessionOnly =
    options.sessionOnly ?? cookieStore.get(SESSION_ONLY_COOKIE)?.value === "1";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options: cookieOptions } of cookiesToSet) {
            cookieStore.set(name, value, withSessionPreference(cookieOptions, sessionOnly));
          }
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the
          // session on every request, so this is safe to ignore there.
        }
      },
    },
  });
}
