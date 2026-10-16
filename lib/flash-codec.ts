/**
 * One-time messages shown as a toast on the next page (after a redirect).
 * Not httpOnly: the Toaster reads and deletes it in the browser. It holds
 * only a message key and optionally a first name — nothing sensitive.
 * Kept free of next/headers so the proxy can use it too.
 */
export const FLASH_COOKIE = "bond-flash";

export type FlashKind =
  | "signed-in"
  | "signed-out"
  | "verified"
  | "account-created"
  | "password-updated"
  | "session-expired"
  | "vendor-approved"
  | "vendor-resubmission"
  | "vendor-rejected"
  | "payment-success"
  | "listing-submitted";

export const flashCookieOptions = {
  path: "/",
  maxAge: 60,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

/** base64url keeps the value cookie-safe without any encoding surprises. */
export function encodeFlash(kind: FlashKind, name?: string | null) {
  return Buffer.from(JSON.stringify({ kind, name: name ?? undefined })).toString("base64url");
}
