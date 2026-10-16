import type { Metadata } from "next";
import { UserDirectory } from "@/components/admin/user-directory";
import { PageTransition } from "@/components/ui/page-transition";
import { listUsers, parseRoleFilter } from "@/lib/admin/users";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "User management" };

export default async function UserManagementPage({ searchParams }: PageProps<"/dashboard/admin/users">) {
  const [, params] = await Promise.all([requireRole("admin"), searchParams]);
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const role = parseRoleFilter(params.role);
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);
  const data = await listUsers({ query, role, page });

  return (
    <PageTransition>
      <UserDirectory query={query} role={role} data={data} />
    </PageTransition>
  );
}
