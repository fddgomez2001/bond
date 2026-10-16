import type { Metadata } from "next";
import { PageTransition } from "@/components/ui/page-transition";
import { SalesView } from "@/components/vendor/sales-view";
import { listShopOrders, requireApprovedVendor } from "@/lib/marketplace/vendor-data";

export const metadata: Metadata = { title: "Sales" };

export default async function VendorSalesPage() {
  await requireApprovedVendor();
  const { orders } = await listShopOrders({ kind: "all", scope: "all" });
  return (
    <PageTransition>
      <SalesView orders={orders} />
    </PageTransition>
  );
}
