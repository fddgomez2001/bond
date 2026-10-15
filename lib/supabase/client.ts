"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Supabase client for Client Components. Phase 1 keeps all auth calls on the
 * server, so nothing imports this yet; it is here for realtime or other
 * browser-side features later.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
