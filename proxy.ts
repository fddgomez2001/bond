import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and the API routes (which
     * create sessions themselves and receive file uploads we don't want
     * buffered here).
     */
    "/((?!_next/static|_next/image|api/|favicon.ico|brand/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
