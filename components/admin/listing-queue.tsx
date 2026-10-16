import { ViewTransition } from "react";
import Link from "next/link";
import { Check, PackageCheck } from "lucide-react";
import { EmptyState, KindBadge, ListingImage, Price } from "@/components/marketplace/bits";
import { Reveal } from "@/components/ui/reveal";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import { listingStatuses } from "@/lib/admin/marketplace";
import { formatDateTime } from "@/lib/format";
import { eventTypeLabel, serviceCategoryLabel } from "@/lib/marketplace/constants";
import { cn } from "@/lib/utils";
import type { Listing, ListingStatus, Shop } from "@/types/marketplace";
import { ListingReviewActions } from "./listing-review-actions";

const BASE = "/dashboard/admin/listings";

const statusMeta: Record<ListingStatus, { label: string; dot: string; empty: string }> = {
  pending_review: { label: "Waiting for review", dot: "bg-amber-500", empty: "All caught up — nothing is waiting for review." },
  approved: { label: "Approved", dot: "bg-emerald-500", empty: "No listings have been approved yet." },
  rejected: { label: "Rejected", dot: "bg-red-500", empty: "No listings have been rejected." },
};

type Row = Listing & { shop: Pick<Shop, "id" | "name" | "slug" | "owner_name"> | null };

/**
 * The flowchart's "Admin approval?" step for vendor products and services.
 * Nothing is visible to customers until it's approved here; any vendor edit
 * sends it back to this queue.
 */
export function ListingQueue({ status, listings, counts }: { status: ListingStatus; listings: Row[]; counts: Record<ListingStatus, number> }) {
  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow="Admin · Marketplace"
        title="Listing Approvals"
        description="Check each product, surprise and event service before customers can see it."
      />
      <WorkspaceContent>
        <nav aria-label="Filter by status">
          <ul className="grid grid-cols-3 gap-3 lg:gap-4">
            {listingStatuses.map((s) => {
              const active = s === status;
              return (
                <li key={s}>
                  <Link
                    href={s === "pending_review" ? BASE : `${BASE}?status=${s}`}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-full flex-col rounded-3xl border p-4 transition-all duration-500 ease-smooth sm:p-5",
                      active
                        ? "border-bond-slate bg-bond-slate text-white shadow-[var(--shadow-card-hover)]"
                        : "border-bond-ink/8 bg-white text-bond-ink shadow-[var(--shadow-card)] hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]",
                    )}
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
                      <span className={cn("size-2 rounded-full", statusMeta[s].dot)} aria-hidden />
                      {statusMeta[s].label}
                    </span>
                    <span className="mt-2 font-heading text-3xl font-bold sm:text-4xl">{counts[s]}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <ViewTransition key={status} enter="list-in" exit="list-out" default="none">
          <section className="pt-8">
            {listings.length === 0 ? (
              <EmptyState icon={PackageCheck} title={statusMeta[status].empty} />
            ) : (
              <ul className="space-y-4">
                {listings.map((listing, index) => (
                  <Reveal as="li" key={listing.id} delay={Math.min(index, 6) * 50}>
                    <article className="grid gap-5 rounded-3xl border border-bond-ink/8 bg-white p-4 shadow-[var(--shadow-card)] sm:p-5 lg:grid-cols-[12rem_1fr_11rem]">
                      <ListingImage
                        path={listing.image_path}
                        kind={listing.kind}
                        alt={listing.title}
                        sizes="(min-width: 1024px) 192px, 100vw"
                        className="aspect-[4/3] w-full rounded-2xl"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <KindBadge kind={listing.kind} className="bg-bond-yellow/40! shadow-none!" />
                          {listing.service_category && (
                            <span className="text-xs font-semibold text-bond-ink/60">{serviceCategoryLabel(listing.service_category)}</span>
                          )}
                          {!listing.is_active && (
                            <span className="rounded-full bg-bond-ink/8 px-2 py-0.5 text-xs text-bond-ink/60">Hidden by vendor</span>
                          )}
                        </div>
                        <h2 className="mt-1.5 font-heading text-lg font-bold text-bond-ink">{listing.title}</h2>
                        <p className="text-sm text-bond-ink/60">
                          {listing.shop?.name ?? "Unknown shop"}
                          {listing.shop?.owner_name && ` · by ${listing.shop.owner_name}`}
                        </p>
                        <Price amount={listing.price} className="mt-1 block font-heading font-bold text-bond-slate" />
                        <p className="mt-2 text-sm whitespace-pre-line text-bond-ink/75">{listing.description}</p>
                        {listing.inclusions.length > 0 && (
                          <ul className="mt-3 grid gap-1 text-sm text-bond-ink/75 sm:grid-cols-2">
                            {listing.inclusions.map((item) => (
                              <li key={item} className="flex items-start gap-2">
                                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                        {listing.event_types.length > 0 && (
                          <p className="mt-3 text-xs text-bond-ink/55">For: {listing.event_types.map(eventTypeLabel).join(", ")}</p>
                        )}
                        {listing.review_notes && status !== "pending_review" && (
                          <p className="mt-3 rounded-2xl bg-bond-cream/70 px-3 py-2 text-xs text-bond-ink/75">
                            <span className="font-semibold">Notes:</span> {listing.review_notes}
                          </p>
                        )}
                        <p className="mt-3 text-xs text-bond-ink/45">Updated {formatDateTime(listing.updated_at)}</p>
                      </div>
                      <ListingReviewActions listingId={listing.id} title={listing.title} status={listing.status} />
                    </article>
                  </Reveal>
                ))}
              </ul>
            )}
          </section>
        </ViewTransition>
      </WorkspaceContent>
    </main>
  );
}
