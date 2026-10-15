import type { Metadata } from "next";
import { VendorHome } from "@/components/dashboard/vendor-home";
import { getOwnVendorProfile, isEmailConfirmed, requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Vendor dashboard" };
export const instant = false;

export default async function VendorDashboardPage({ searchParams }: PageProps<"/dashboard/vendor">) {
  const [{ user, profile }, params] = await Promise.all([requireRole("vendor"), searchParams]);
  const [vendor, emailConfirmed] = await Promise.all([getOwnVendorProfile(user.id), isEmailConfirmed()]);

  return (
    <VendorHome
      profile={profile}
      vendor={vendor}
      email={user.email}
      emailConfirmed={emailConfirmed}
      justVerified={params.welcome === "1"}
    />
  );
}
