import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarHeart, Check, PartyPopper, ShieldCheck, Truck } from "lucide-react";
import { AddToCart } from "@/components/marketplace/add-to-cart";
import { KindBadge, ListingImage, Price } from "@/components/marketplace/bits";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { getCurrentAccount } from "@/lib/auth/session";
import { formatPeso } from "@/lib/format";
import { getListing } from "@/lib/marketplace/catalog";
import { eventTypeLabel, serviceCategoryLabel } from "@/lib/marketplace/constants";
import { isUuid } from "@/lib/utils";
import type { Listing } from "@/types/marketplace";

export async function generateMetadata({ params }: PageProps<"/shops/[slug]/items/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = isUuid(id) ? await getListing(id) : null;
  return listing ? { title: `${listing.title} · ${listing.shop.name}` } : { title: "Not found" };
}

export default async function ListingPage({ params }: PageProps<"/shops/[slug]/items/[id]">) {
  const { slug, id } = await params;
  if (!isUuid(id)) notFound();
  const listing = await getListing(id);
  if (!listing) notFound();
  // Old links keep working if the shop is renamed.
  if (listing.shop.slug !== slug) redirect(`/shops/${listing.shop.slug}/items/${listing.id}`);

  const fee = Number(listing.shop.delivery_fee);

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8 sm:py-10 lg:px-10">
        <Link
          href={`/shops/${listing.shop.slug}?tab=${listing.kind}`}
          transitionTypes={["nav-back"]}
          className="inline-flex items-center gap-1 text-sm font-semibold text-bond-slate/80 transition-colors hover:text-bond-slate"
        >
          <ArrowLeft className="size-4" aria-hidden /> {listing.shop.name}
        </Link>

        <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ListingImage
            path={listing.image_path}
            kind={listing.kind}
            alt={listing.title}
            preload
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="aspect-[4/3] w-full rounded-[28px] shadow-[var(--shadow-card)]"
          />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <KindBadge kind={listing.kind} className="bg-bond-yellow/50! shadow-none!" />
              {listing.service_category && (
                <span className="text-sm font-semibold text-bond-ink/60">{serviceCategoryLabel(listing.service_category)}</span>
              )}
            </div>
            <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-bond-ink sm:text-4xl">{listing.title}</h1>
            <p className="mt-1 text-bond-ink/60">
              by{" "}
              <Link href={`/shops/${listing.shop.slug}`} className="font-semibold text-bond-slate underline-offset-2 hover:underline">
                {listing.shop.name}
              </Link>
              {listing.shop.city && ` · ${listing.shop.city}`}
            </p>
            <p className="mt-4 font-heading text-3xl font-bold text-bond-slate">
              {listing.kind === "service" && <span className="mr-1 text-base font-medium text-bond-ink/55">from</span>}
              <Price amount={listing.price} />
            </p>

            <p className="mt-5 leading-relaxed whitespace-pre-line text-bond-ink/80">{listing.description}</p>

            {listing.inclusions.length > 0 && (
              <section className="mt-6 rounded-3xl bg-white p-5 shadow-[var(--shadow-card)]">
                <h2 className="font-heading font-bold text-bond-ink">
                  {listing.service_category === "package" ? "This package includes" : "Inclusions"}
                </h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {listing.inclusions.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-bond-ink/80">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {listing.event_types.length > 0 && (
              <p className="mt-4 text-sm text-bond-ink/60">For {listing.event_types.map(eventTypeLabel).join(", ")}</p>
            )}

            <div className="mt-8 rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
              <Suspense fallback={<div className="h-12 animate-pulse rounded-2xl bg-bond-ink/5" />}>
                <OrderBox listing={listing} />
              </Suspense>
              <ul className="mt-5 space-y-2 border-t border-bond-ink/8 pt-4 text-sm text-bond-ink/65">
                {listing.kind === "gift" && (
                  <li className="flex items-center gap-2">
                    <Truck className="size-4 text-bond-slate" aria-hidden />
                    {fee === 0 ? "Free delivery from this shop" : `${formatPeso(fee)} delivery fee, once per order`}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-bond-slate" aria-hidden />
                  BOND holds your payment until you confirm you received it.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}

/** What you can do with the listing depends on who's looking. */
async function OrderBox({ listing }: { listing: Listing & { shop: { slug: string } } }) {
  const account = await getCurrentAccount();
  const here = `/shops/${listing.shop.slug}/items/${listing.id}`;

  if (!account) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-bond-ink/70">Log in with a customer account to order.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={`/login?next=${encodeURIComponent(here)}`} className={buttonClasses({ size: "lg", className: "flex-1" })}>
            Log in to order
          </Link>
          <Link href="/signup/customer" className={buttonClasses({ variant: "outline", size: "lg", className: "flex-1" })}>
            Create an account
          </Link>
        </div>
      </div>
    );
  }
  if (account.profile?.role !== "customer") {
    return <Alert tone="info">You&apos;re signed in as a {account.profile?.role ?? "member"}. Ordering is for customer accounts.</Alert>;
  }
  if (listing.kind === "gift") return <AddToCart listingId={listing.id} title={listing.title} />;
  if (listing.kind === "surprise") {
    return (
      <Link href={`/order/surprise?listing=${listing.id}`} transitionTypes={["nav-forward"]} className={buttonClasses({ size: "lg", className: "w-full" })}>
        <PartyPopper className="size-5" aria-hidden />
        Book this surprise
      </Link>
    );
  }
  return (
    <Link href={`/order/event?listing=${listing.id}`} transitionTypes={["nav-forward"]} className={buttonClasses({ size: "lg", className: "w-full" })}>
      <CalendarHeart className="size-5" aria-hidden />
      {listing.service_category === "package" ? "Book this package for my event" : "Add to my event"}
    </Link>
  );
}
