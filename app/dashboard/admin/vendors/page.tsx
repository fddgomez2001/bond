import type { Metadata } from "next";
import { VendorQueue } from "@/components/admin/vendor-queue";
import { PageTransition } from "@/components/ui/page-transition";
import { listVendorApplications, parseReviewStatus } from "@/lib/admin/vendor-applications";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Vendor applications" };

export default async function VendorApplicationsPage({ searchParams }: PageProps<"/dashboard/admin/vendors">) {
  const [, params] = await Promise.all([requireRole("admin"), searchParams]);
  const status = parseReviewStatus(params.status);
  const { counts, applications, loadError } = await listVendorApplications(status);

  return (
    <PageTransition>
      <VendorQueue
        status={status}
        counts={counts}
        applications={applications}
        loadError={loadError}
        canReadEmails={Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}
      />
    </PageTransition>
  );
}
