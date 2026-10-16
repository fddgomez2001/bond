import type { Metadata } from "next";
import { AdminOverview } from "@/components/admin/admin-overview";
import { PageTransition } from "@/components/ui/page-transition";
import { getAdminOverview } from "@/lib/admin/users";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const { profile } = await requireRole("admin");
  const data = await getAdminOverview();

  return (
    <PageTransition>
      <AdminOverview firstName={profile.first_name} data={data} />
    </PageTransition>
  );
}
