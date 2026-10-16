import { ViewTransition } from "react";
import Form from "next/form";
import Link from "next/link";
import { PackageOpen, Pencil, Plus, Search, Store } from "lucide-react";
import { EmptyState, KindBadge, ListingImage, Price } from "@/components/marketplace/bits";
import { buttonClasses } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/field";
import { Reveal } from "@/components/ui/reveal";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import { serviceCategoryLabel } from "@/lib/marketplace/constants";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types/marketplace";
import { ListingRowActions } from "./listing-actions";

export type ListingFilter = "all" | "live" | "pending" | "rejected" | "hidden";

export const listingFilters: { value: ListingFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "pending", label: "Waiting for approval" },
  { value: "rejected", label: "Needs changes" },
  { value: "hidden", label: "Hidden" },
];

export const parseListingFilter = (value: unknown): ListingFilter =>
  listingFilters.find((f) => f.value === value)?.value ?? "all";

function listingState(listing: Listing): { filter: Exclude<ListingFilter, "all">; label: string; tone: string } {
  if (listing.status === "rejected") return { filter: "rejected", label: "Needs changes", tone: "bg-red-100 text-red-900" };
  if (listing.status === "pending_review") return { filter: "pending", label: "Waiting for approval", tone: "bg-amber-100 text-amber-900" };
  if (!listing.is_active) return { filter: "hidden", label: "Hidden", tone: "bg-bond-ink/10 text-bond-ink/70" };
  return { filter: "live", label: "Live", tone: "bg-emerald-100 text-emerald-900" };
}

/**
 * Vendor Products / Services page: search, status filters and every listing
 * with its approval state. "Add" is always available (not only when a search
 * finds nothing, as the original flowchart had it).
 */
export function ListingManager({
  group,
  listings,
  hasShop,
  filter,
  query,
}: {
  group: "products" | "services";
  listings: Listing[];
  hasShop: boolean;
  filter: ListingFilter;
  query: string;
}) {
  const base = `/dashboard/vendor/${group}`;
  const isProducts = group === "products";
  const needle = query.trim().toLowerCase();
  const counts = { all: listings.length, live: 0, pending: 0, rejected: 0, hidden: 0 } as Record<ListingFilter, number>;
  for (const l of listings) counts[listingState(l).filter] += 1;
  const shown = listings.filter(
    (l) =>
      (filter === "all" || listingState(l).filter === filter) &&
      (!needle || l.title.toLowerCase().includes(needle) || l.description.toLowerCase().includes(needle)),
  );

  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow={`Vendor · ${isProducts ? "Products" : "Services"}`}
        title={isProducts ? "Products & surprises" : "Event services"}
        description={
          isProducts
            ? "Gifts customers add to their cart, and surprises they book for a date and time."
            : "Packages and individual services (venue, catering, photo & video…) for corporate, social and cultural events."
        }
        actions={
          hasShop ? (
            <Link href={`${base}/new`} className={buttonClasses({ variant: "primary", className: "group" })}>
              <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" aria-hidden />
              {isProducts ? "Add product" : "Add service"}
            </Link>
          ) : null
        }
      />

      <WorkspaceContent>
        {!hasShop ? (
          <EmptyState
            icon={Store}
            title="Set up your shop first"
            action={
              <Link href="/dashboard/vendor/shop" className={buttonClasses({ variant: "gold" })}>
                Set up my shop
              </Link>
            }
          >
            Your products and services are listed under your shop, so customers know who they&apos;re ordering from.
          </EmptyState>
        ) : (
          <>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <nav aria-label="Filter by status" className="-mx-1 overflow-x-auto px-1 pb-1">
                <ul className="flex w-max gap-2">
                  {listingFilters.map((f) => (
                    <li key={f.value}>
                      <Link
                        href={{ pathname: base, query: { ...(f.value !== "all" && { status: f.value }), ...(query && { q: query }) } }}
                        scroll={false}
                        aria-current={f.value === filter ? "page" : undefined}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-300 ease-smooth",
                          f.value === filter
                            ? "border-bond-slate bg-bond-slate text-white"
                            : "border-bond-ink/12 bg-white text-bond-ink/75 hover:border-bond-slate/40",
                        )}
                      >
                        {f.label}
                        <span className={cn("rounded-full px-1.5 text-xs", f.value === filter ? "bg-white/20" : "bg-bond-ink/8")}>
                          {counts[f.value]}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <Form action={base} scroll={false} className="relative w-full lg:max-w-xs">
                {filter !== "all" && <input type="hidden" name="status" value={filter} />}
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-bond-ink/40" aria-hidden />
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder={isProducts ? "Search products" : "Search services"}
                  aria-label={isProducts ? "Search products" : "Search services"}
                  className={inputClasses(false, "pl-10")}
                />
              </Form>
            </div>

            <ViewTransition key={`${filter}-${query}`} enter="list-in" exit="list-out" default="none">
              <div className="pt-6">
                {shown.length === 0 ? (
                  <EmptyState
                    icon={PackageOpen}
                    title={listings.length === 0 ? `No ${isProducts ? "products" : "services"} yet` : "Nothing matches"}
                    action={
                      <Link href={`${base}/new`} className={buttonClasses({ variant: "gold" })}>
                        <Plus className="size-4" aria-hidden />
                        {isProducts ? "Add a product" : "Add a service"}
                      </Link>
                    }
                  >
                    {listings.length === 0
                      ? "Add your first one — BOND reviews it before customers can see it."
                      : "Try a different search or status, or add a new one."}
                  </EmptyState>
                ) : (
                  <ul className="space-y-3">
                    {shown.map((listing, index) => {
                      const state = listingState(listing);
                      return (
                        <Reveal as="li" key={listing.id} delay={Math.min(index, 6) * 50}>
                          <article className="flex flex-col gap-4 rounded-3xl border border-bond-ink/8 bg-white p-4 shadow-[var(--shadow-card)] transition-shadow duration-500 hover:shadow-[var(--shadow-card-hover)] sm:flex-row sm:items-center">
                            <Link href={`${base}/${listing.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                              <ListingImage
                                path={listing.image_path}
                                kind={listing.kind}
                                alt=""
                                sizes="128px"
                                className="aspect-[4/3] w-24 shrink-0 rounded-2xl sm:w-28"
                              />
                              <span className="min-w-0">
                                <span className="flex flex-wrap items-center gap-2">
                                  <KindBadge kind={listing.kind} className="bg-bond-yellow/40! shadow-none!" />
                                  {listing.service_category && (
                                    <span className="text-xs font-semibold text-bond-ink/55">{serviceCategoryLabel(listing.service_category)}</span>
                                  )}
                                </span>
                                <span className="mt-1 block truncate font-heading font-semibold text-bond-ink">{listing.title}</span>
                                <Price amount={listing.price} className="text-sm font-semibold text-bond-slate" />
                                {listing.status === "rejected" && listing.review_notes && (
                                  <span className="mt-1 line-clamp-2 block text-xs text-red-800">
                                    <span className="font-semibold">Reviewer:</span> {listing.review_notes}
                                  </span>
                                )}
                              </span>
                            </Link>
                            <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                              <span className={cn("rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap", state.tone)}>{state.label}</span>
                              <span className="flex items-center">
                                <Link
                                  href={`${base}/${listing.id}`}
                                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-bond-slate transition-colors hover:bg-bond-slate/10"
                                >
                                  <Pencil className="size-4" aria-hidden /> Edit
                                  <span className="sr-only"> {listing.title}</span>
                                </Link>
                                <ListingRowActions listingId={listing.id} title={listing.title} active={listing.is_active} />
                              </span>
                            </div>
                          </article>
                        </Reveal>
                      );
                    })}
                  </ul>
                )}
              </div>
            </ViewTransition>
          </>
        )}
      </WorkspaceContent>
    </main>
  );
}
