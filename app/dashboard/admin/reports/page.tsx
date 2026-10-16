import type { Metadata } from "next";
import { ReportList } from "@/components/admin/report-list";
import { PageTransition } from "@/components/ui/page-transition";
import { listReports } from "@/lib/admin/marketplace";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Reports" };

export default async function AdminReportsPage({ searchParams }: PageProps<"/dashboard/admin/reports">) {
  const [, params] = await Promise.all([requireRole("admin"), searchParams]);
  const status = params.status === "resolved" ? "resolved" : "open";
  const data = await listReports(status);
  return (
    <PageTransition>
      <ReportList status={status} data={data} />
    </PageTransition>
  );
}
