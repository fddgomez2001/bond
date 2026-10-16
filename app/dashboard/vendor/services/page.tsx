import type { Metadata } from "next";
import { PageTransition } from "@/components/ui/page-transition";
import { ListingManager, parseListingFilter } from "@/components/vendor/listing-manager";
import { getMyShop, listMyListings, requireApprovedVendor } from "@/lib/marketplace/vendor-data";

export const metadata: Metadata = { title: "Services" };

export default async function VendorServicesPage({ searchParams }: PageProps<"/dashboard/vendor/services">) {
  const [, params] = await Promise.all([requireApprovedVendor(), searchParams]);
  const [shop, listings] = await Promise.all([getMyShop(), listMyListings(["service"])]);

  return (
    <PageTransition>
      <ListingManager
        group="services"
        listings={listings}
        hasShop={Boolean(shop)}
        filter={parseListingFilter(params.status)}
        query={typeof params.q === "string" ? params.q.slice(0, 80) : ""}
      />
    </PageTransition>
  );
}
