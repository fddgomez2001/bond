import type { Metadata } from "next";
import { PageTransition } from "@/components/ui/page-transition";
import { ListingEditor } from "@/components/vendor/listing-editor";
import { getMyShop, requireApprovedVendor } from "@/lib/marketplace/vendor-data";

export const metadata: Metadata = { title: "Add service" };

export default async function NewServicePage() {
  await requireApprovedVendor();
  const shop = await getMyShop();
  return (
    <PageTransition>
      <ListingEditor group="services" shop={shop} listing={null} />
    </PageTransition>
  );
}
