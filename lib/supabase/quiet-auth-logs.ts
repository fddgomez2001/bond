/**
 * Supabase logs a full stack trace (console.warn / console.error) whenever a
 * browser sends a login cookie whose refresh token no longer exists — e.g.
 * after logging out on another device. That's expected: Supabase clears the
 * cookie and the visitor is simply signed out. This swaps those specific
 * errors for one readable line. Every other error is printed unchanged.
 */
const EXPECTED_SESSION_CODES = new Set([
  "refresh_token_not_found",
  "refresh_token_already_used",
  "session_expired",
  "session_not_found",
]);

function isExpectedSessionError(value: unknown): value is { code: string } {
  if (typeof value !== "object" || value === null) return false;
  const error = value as { __isAuthError?: unknown; code?: unknown };
  return error.__isAuthError === true && EXPECTED_SESSION_CODES.has(String(error.code));
}

export function quietExpectedAuthLogs() {
  const marker = globalThis as { __bondQuietAuthLogs?: boolean };
  if (marker.__bondQuietAuthLogs) return;
  marker.__bondQuietAuthLogs = true;

  const info = console.info.bind(console);
  for (const method of ["warn", "error"] as const) {
    const original = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      const [first] = args;
      if (args.length === 1 && isExpectedSessionError(first)) {
        info(`[auth] Cleared an expired login session (${first.code}). The visitor was signed out.`);
        return;
      }
      original(...args);
    };
  }
}
