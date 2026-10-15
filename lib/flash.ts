import "server-only";

import { cookies } from "next/headers";

/**
 * One-time messages shown as a toast on the next page (after a redirect).
 * Not httpOnly: the Toaster reads and deletes it in the browser. It holds
 * only a message key and optionally a first name — nothing sensitive.
 */
export const FLASH_COOKIE = "bond-flash";

export type FlashKind = "signed-in" | "signed-out" | "verified" | "account-created" | "password-updated";

export async function setFlash(kind: FlashKind, name?: string | null) {
  // base64url keeps the value cookie-safe without any encoding surprises.
  const value = Buffer.from(JSON.stringify({ kind, name: name ?? undefined })).toString("base64url");
  (await cookies()).set(FLASH_COOKIE, value, {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
