import type { Metadata } from "next";
import { AdminProfile } from "@/components/admin/admin-profile";
import { PageTransition } from "@/components/ui/page-transition";
import { authDetailsFor } from "@/lib/admin/auth-users";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Your profile" };

export default async function AdminProfilePage() {
  const { user, profile } = await requireRole("admin");
  const details = (await authDetailsFor([user.id])).get(user.id) ?? null;

  return (
    <PageTransition>
      <AdminProfile profile={profile} email={user.email} details={details} />
    </PageTransition>
  );
}
