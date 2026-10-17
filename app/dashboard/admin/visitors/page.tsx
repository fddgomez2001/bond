import type { Metadata } from "next";
import { SiteVisitors } from "@/components/admin/site-visitors";
import { PageTransition } from "@/components/ui/page-transition";
import { getSiteActivity, parseActivityRange } from "@/lib/admin/site-activity";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Site visitors" };

export default async function SiteVisitorsPage({ searchParams }: PageProps<"/dashboard/admin/visitors">) {
  const [, params] = await Promise.all([requireRole("admin"), searchParams]);
  const range = parseActivityRange(params.range);
  const includeLocal = params.local === "1";
  const data = await getSiteActivity({ range, includeLocal });
  return (
    <PageTransition>
      <SiteVisitors range={range} includeLocal={includeLocal} data={data} />
    </PageTransition>
  );
}
