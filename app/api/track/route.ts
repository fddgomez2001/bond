import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { after, NextResponse } from "next/server";
import { z } from "zod";
import { VISITOR_COOKIE, describeRequest, recordVisit, validVisitorId, visitorCookieOptions } from "@/lib/analytics/record";
import { getSessionUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";

const bodySchema = z.object({
  path: z.string().trim().min(1).max(300).startsWith("/"),
  referrer: z.string().trim().max(500).optional(),
  hints: z
    .object({
      model: z.string().trim().max(80).optional(),
      platform: z.string().trim().max(40).optional(),
      platformVersion: z.string().trim().max(40).optional(),
      mobile: z.boolean().optional(),
      touchPoints: z.number().int().min(0).max(32).optional(),
    })
    .optional(),
});

/** Only this site's own pages may report visits. */
function fromThisSite(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  return request.headers.get("sec-fetch-site") === "same-origin";
}

const noContent = () => new NextResponse(null, { status: 204 });

/**
 * Page-view beacon from components/analytics/visit-tracker.tsx. Answers
 * immediately; the visit is saved after the response is sent.
 */
export async function POST(request: Request) {
  if (!fromThisSite(request)) return new NextResponse(null, { status: 403 });
  if (!checkRateLimit(`track:${getClientIp(request.headers)}`, { limit: 120, windowMs: 60_000 }).allowed) {
    return new NextResponse(null, { status: 429 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const path = body.path.split(/[?#]/)[0] || "/";
  // The admin area isn't "the website"; admins checking stats shouldn't count.
  if (path.startsWith("/dashboard/admin") || path.startsWith("/api/")) return noContent();

  const device = describeRequest(request.headers, body.hints);
  if (device.bot) return noContent();

  let referrerHost: string | null = null;
  if (body.referrer) {
    try {
      const host = new URL(body.referrer).host;
      if (host && host !== device.host) referrerHost = host.slice(0, 120);
    } catch {
      // Not a URL; ignore.
    }
  }

  const response = noContent();
  let visitorId = validVisitorId((await cookies()).get(VISITOR_COOKIE)?.value);
  if (!visitorId) {
    visitorId = randomUUID();
    response.cookies.set(VISITOR_COOKIE, visitorId, visitorCookieOptions);
  }
  const id = visitorId;

  after(async () => {
    const user = await getSessionUser().catch(() => null);
    await recordVisit({ visitorId: id, userId: user?.id ?? null, path, referrerHost, device });
  });

  return response;
}
