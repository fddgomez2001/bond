import type { Metadata } from "next";
import { PageTransition } from "@/components/ui/page-transition";
import { ReviewsView } from "@/components/vendor/reviews-view";
import { listMyReviews, requireApprovedVendor } from "@/lib/marketplace/vendor-data";

export const metadata: Metadata = { title: "Reviews" };

export default async function VendorReviewsPage() {
  await requireApprovedVendor();
  const reviews = await listMyReviews();
  return (
    <PageTransition>
      <ReviewsView reviews={reviews} />
    </PageTransition>
  );
}
