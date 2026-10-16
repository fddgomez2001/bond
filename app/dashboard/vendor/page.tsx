import type { Metadata } from "next";
import { PageTransition } from "@/components/ui/page-transition";
import { ApplicationStatus } from "@/components/vendor/application-status";
import { VendorOverview } from "@/components/vendor/vendor-overview";
import { getOwnVendorProfile, isEmailConfirmed, requireRole } from "@/lib/auth/session";
import { getVendorStats } from "@/lib/marketplace/vendor-data";

export const metadata: Metadata = { title: "Vendor dashboard" };

export default async function VendorDashboardPage({ searchParams }: PageProps<"/dashboard/vendor">) {
  const [{ user, profile }, params] = await Promise.all([requireRole("vendor"), searchParams]);
  const [vendor, emailConfirmed] = await Promise.all([getOwnVendorProfile(user.id), isEmailConfirmed()]);

  // "Account verified?" — No: application status. Yes: the vendor tools.
  if (vendor?.business_verification_status !== "approved") {
    return (
      <PageTransition>
        <ApplicationStatus
          profile={profile}
          vendor={vendor}
          emailConfirmed={emailConfirmed}
          justVerified={params.welcome === "1"}
        />
      </PageTransition>
    );
  }

  const stats = await getVendorStats();
  return (
    <PageTransition>
      <VendorOverview firstName={profile.first_name} stats={stats} />
    </PageTransition>
  );
}
