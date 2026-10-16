import type { Metadata } from "next";
import { PageTransition } from "@/components/ui/page-transition";
import { OrderBoard, parseKindFilter, parseScope } from "@/components/vendor/order-board";
import { listShopOrders, requireApprovedVendor } from "@/lib/marketplace/vendor-data";

export const metadata: Metadata = { title: "Orders" };

export default async function VendorOrdersPage({ searchParams }: PageProps<"/dashboard/vendor/orders">) {
  const [, params] = await Promise.all([requireApprovedVendor(), searchParams]);
  const kind = parseKindFilter(params.kind);
  const scope = parseScope(params.scope);
  const { orders, counts } = await listShopOrders({ kind, scope });
  return (
    <PageTransition>
      <OrderBoard kind={kind} scope={scope} orders={orders} counts={counts} />
    </PageTransition>
  );
}
