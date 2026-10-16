import type { Metadata } from "next";
import { OrderTable, parseAdminOrderFilter } from "@/components/admin/order-table";
import { PageTransition } from "@/components/ui/page-transition";
import { listAllOrders } from "@/lib/admin/marketplace";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/dashboard/admin/orders">) {
  const [, params] = await Promise.all([requireRole("admin"), searchParams]);
  const status = parseAdminOrderFilter(params.status);
  const data = await listAllOrders(status);
  return (
    <PageTransition>
      <OrderTable status={status} data={data} />
    </PageTransition>
  );
}
