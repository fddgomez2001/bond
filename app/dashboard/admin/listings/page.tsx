import type { Metadata } from "next";
import { ListingQueue } from "@/components/admin/listing-queue";
import { PageTransition } from "@/components/ui/page-transition";
import { listListingsForReview, parseListingStatus } from "@/lib/admin/marketplace";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Listing approvals" };

export default async function ListingApprovalsPage({ searchParams }: PageProps<"/dashboard/admin/listings">) {
  const [, params] = await Promise.all([requireRole("admin"), searchParams]);
  const status = parseListingStatus(params.status);
  const { listings, counts } = await listListingsForReview(status);
  return (
    <PageTransition>
      <ListingQueue status={status} listings={listings} counts={counts} />
    </PageTransition>
  );
}
