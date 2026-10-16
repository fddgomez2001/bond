import type { Metadata } from "next";
import { PageTransition } from "@/components/ui/page-transition";
import { ListingManager, parseListingFilter } from "@/components/vendor/listing-manager";
import { getMyShop, listMyListings, requireApprovedVendor } from "@/lib/marketplace/vendor-data";

export const metadata: Metadata = { title: "Products" };

export default async function VendorProductsPage({ searchParams }: PageProps<"/dashboard/vendor/products">) {
  const [, params] = await Promise.all([requireApprovedVendor(), searchParams]);
  const [shop, listings] = await Promise.all([getMyShop(), listMyListings(["gift", "surprise"])]);

  return (
    <PageTransition>
      <ListingManager
        group="products"
        listings={listings}
        hasShop={Boolean(shop)}
        filter={parseListingFilter(params.status)}
        query={typeof params.q === "string" ? params.q.slice(0, 80) : ""}
      />
    </PageTransition>
  );
}
