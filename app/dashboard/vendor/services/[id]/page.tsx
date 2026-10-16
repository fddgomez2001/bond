import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTransition } from "@/components/ui/page-transition";
import { ListingEditor } from "@/components/vendor/listing-editor";
import { getMyListing, getMyShop, requireApprovedVendor } from "@/lib/marketplace/vendor-data";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit service" };

export default async function EditServicePage({ params }: PageProps<"/dashboard/vendor/services/[id]">) {
  const [, { id }] = await Promise.all([requireApprovedVendor(), params]);
  if (!isUuid(id)) notFound();
  const [shop, listing] = await Promise.all([getMyShop(), getMyListing(id)]);
  if (!listing || listing.kind !== "service") notFound();
  return (
    <PageTransition>
      <ListingEditor group="services" shop={shop} listing={listing} />
    </PageTransition>
  );
}
