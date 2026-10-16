import "server-only";

import { cookies } from "next/headers";
import { FLASH_COOKIE, encodeFlash, flashCookieOptions, type FlashKind } from "./flash-codec";

export type { FlashKind };

/** Queues a toast for the next page the user sees (Server Actions / Route Handlers). */
export async function setFlash(kind: FlashKind, name?: string | null) {
  (await cookies()).set(FLASH_COOKIE, encodeFlash(kind, name), flashCookieOptions);
}
