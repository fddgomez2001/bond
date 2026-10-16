import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";
import { EmptyState } from "@/components/marketplace/bits";
import { buttonClasses } from "@/components/ui/button";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import type { ListingKind } from "@/lib/marketplace/constants";
import { mediaUrl } from "@/lib/marketplace/media";
import type { Listing, Shop } from "@/types/marketplace";
import { ListingForm } from "./listing-form";

/** Page body for adding or editing a product / service. */
export function ListingEditor({
  group,
  shop,
  listing,
  initialKind,
}: {
  group: "products" | "services";
  shop: Shop | null;
  listing: Listing | null;
  initialKind?: ListingKind;
}) {
  const isProducts = group === "products";
  const noun = isProducts ? "product" : "service";
  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow={
          <Link
            href={`/dashboard/vendor/${group}`}
            transitionTypes={["nav-back"]}
            className="inline-flex items-center gap-1 rounded-lg transition-colors hover:text-bond-slate"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> {isProducts ? "Products" : "Services"}
          </Link>
        }
        title={listing ? `Edit ${listing.title}` : `Add a ${noun}`}
        description={
          isProducts
            ? "Gifts are delivered by your shop; surprises are booked for a date and time."
            : "Add a full package (with its inclusions) or a single service customers can combine for their event."
        }
      />
      <WorkspaceContent>
        {shop ? (
          <ListingForm group={group} listing={listing} imageUrl={mediaUrl(listing?.image_path)} initialKind={initialKind} />
        ) : (
          <EmptyState
            icon={Store}
            title="Set up your shop first"
            action={
              <Link href="/dashboard/vendor/shop" className={buttonClasses({ variant: "gold" })}>
                Set up my shop
              </Link>
            }
          >
            Every {noun} belongs to your shop, so customers know who they&apos;re ordering from.
          </EmptyState>
        )}
      </WorkspaceContent>
    </main>
  );
}
