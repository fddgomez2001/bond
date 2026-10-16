import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { FLASH_COOKIE, encodeFlash, flashCookieOptions } from "@/lib/flash-codec";
import {
  SESSION_ONLY_COOKIE,
  authCookieOptions,
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
  withSessionPreference,
} from "./config";

const PROTECTED_PREFIXES = ["/dashboard", "/order", "/cart", "/checkout", "/orders", "/bookings"];
// Supabase SSR stores the session as sb-<project>-auth-token (chunked as .0, .1, …).
const AUTH_COOKIE = /^sb-.+-auth-token(\.\d+)?$/;
// Signed-in users have no reason to see these, so send them to their dashboard.
const GUEST_ONLY_PREFIXES = ["/login", "/signup", "/forgot-password", "/verify-email"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Refreshes the Supabase session cookie on every request and performs the
 * optimistic redirects. The real authorization checks happen again in the
 * pages and in Postgres (RLS); this only avoids rendering pages that would
 * redirect anyway.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

  const sessionOnly = request.cookies.get(SESSION_ONLY_COOKIE)?.value === "1";
  // Read before Supabase touches the cookies: did the browser send a session?
  const hadSessionCookie = request.cookies.getAll().some((c) => AUTH_COOKIE.test(c.name));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, withSessionPreference(options, sessionOnly));
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // Do not put code between createServerClient and getClaims: getClaims
  // refreshes an expired session, and the refreshed cookies must reach the
  // response above.
  let userId: string | undefined;
  try {
    const { data } = await supabase.auth.getClaims();
    userId = data?.claims?.sub;
  } catch {
    userId = undefined;
  }

  // A session cookie Supabase could not use (revoked, logged out on another
  // device, user deleted). Supabase has already queued its deletion above.
  const sessionEnded = hadSessionCookie && !userId;

  const { pathname, search } = request.nextUrl;

  const redirectTo = (path: string, params: Record<string, string> = {}) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = new URLSearchParams(params).toString();
    const redirect = NextResponse.redirect(url);
    // Keep any refreshed auth cookies.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!userId && matches(pathname, PROTECTED_PREFIXES)) {
    const redirect = redirectTo("/login", { next: pathname + search });
    if (sessionEnded) redirect.cookies.set(FLASH_COOKIE, encodeFlash("session-expired"), flashCookieOptions);
    return redirect;
  }

  if (userId && matches(pathname, GUEST_ONLY_PREFIXES)) {
    return redirectTo("/dashboard");
  }

  return response;
}
