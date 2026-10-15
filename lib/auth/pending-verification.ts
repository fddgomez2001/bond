import "server-only";

import { cookies } from "next/headers";

/**
 * Remembers which email is waiting for verification so the address stays
 * out of the URL (and out of browser history and server logs). httpOnly, so
 * page scripts cannot read it.
 */
const COOKIE = "bond-pending-verification";
const MAX_AGE_SECONDS = 60 * 60;

export type PendingVerification = { email: string; role: "customer" | "vendor" | null };

export async function setPendingVerification(value: PendingVerification) {
  const store = await cookies();
  store.set(COOKIE, encodeURIComponent(JSON.stringify(value)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getPendingVerification(): Promise<PendingVerification | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (typeof parsed?.email !== "string") return null;
    const role = parsed.role === "customer" || parsed.role === "vendor" ? parsed.role : null;
    return { email: parsed.email, role };
  } catch {
    return null;
  }
}

export async function clearPendingVerification() {
  (await cookies()).delete(COOKIE);
}

/** Marks a session that was opened through a password-recovery code or link. */
export const RECOVERY_COOKIE = "bond-recovery";

export async function markRecoverySession() {
  (await cookies()).set(RECOVERY_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
}
