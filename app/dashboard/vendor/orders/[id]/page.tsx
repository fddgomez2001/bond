import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTransition } from "@/components/ui/page-transition";
import { VendorOrderDetail } from "@/components/vendor/order-detail";
import { getShopOrder, requireApprovedVendor } from "@/lib/marketplace/vendor-data";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Order details" };

export default async function VendorOrderPage({ params }: PageProps<"/dashboard/vendor/orders/[id]">) {
  const [, { id }] = await Promise.all([requireApprovedVendor(), params]);
  if (!isUuid(id)) notFound();
  const data = await getShopOrder(id);
  // Unpaid orders aren't the shop's business yet.
  if (!data || data.order.status === "awaiting_payment") notFound();
  return (
    <PageTransition>
      <VendorOrderDetail data={data} />
    </PageTransition>
  );
}
