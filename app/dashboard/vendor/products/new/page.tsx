import type { Metadata } from "next";
import { PageTransition } from "@/components/ui/page-transition";
import { ListingEditor } from "@/components/vendor/listing-editor";
import { getMyShop, requireApprovedVendor } from "@/lib/marketplace/vendor-data";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage({ searchParams }: PageProps<"/dashboard/vendor/products/new">) {
  const [, params] = await Promise.all([requireApprovedVendor(), searchParams]);
  const shop = await getMyShop();
  return (
    <PageTransition>
      <ListingEditor group="products" shop={shop} listing={null} initialKind={params.kind === "surprise" ? "surprise" : "gift"} />
    </PageTransition>
  );
}
