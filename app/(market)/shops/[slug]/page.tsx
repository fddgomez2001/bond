import { ViewTransition } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, MessageSquareHeart, PackageOpen, Phone, Truck } from "lucide-react";
import { EmptyState, RatingStars } from "@/components/marketplace/bits";
import { ListingCard, ShopLogo } from "@/components/marketplace/cards";
import { MarketContent } from "@/components/marketplace/market-hero";
import { PageTransition } from "@/components/ui/page-transition";
import { Reveal } from "@/components/ui/reveal";
import { formatDateTime, formatPeso } from "@/lib/format";
import { getShop } from "@/lib/marketplace/catalog";
import { kindMeta, type ListingKind } from "@/lib/marketplace/constants";
import { cn } from "@/lib/utils";

const SLUG = /^[a-z0-9-]{1,80}$/;

export async function generateMetadata({ params }: PageProps<"/shops/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = SLUG.test(slug) ? await getShop(slug) : null;
  return data ? { title: data.shop.name, description: data.shop.tagline ?? undefined } : { title: "Shop not found" };
}

type Tab = ListingKind | "reviews";

export default async function ShopPage({ params, searchParams }: PageProps<"/shops/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!SLUG.test(slug)) notFound();
  const data = await getShop(slug);
  if (!data) notFound();
  const { shop, listings, reviews, rating } = data;

  const kinds = (Object.keys(kindMeta) as ListingKind[]).filter((k) => listings.some((l) => l.kind === k));
  const tabs: { value: Tab; label: string; count: number }[] = [
    ...kinds.map((k) => ({ value: k as Tab, label: kindMeta[k].plural, count: listings.filter((l) => l.kind === k).length })),
    { value: "reviews", label: "Reviews", count: reviews.length },
  ];
  const requested = tabs.find((t) => t.value === query.tab)?.value;
  const tab: Tab = requested ?? kinds[0] ?? "reviews";
  const shown = tab === "reviews" ? [] : listings.filter((l) => l.kind === tab);
  const fee = Number(shop.delivery_fee);

  return (
    <PageTransition>
      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden bg-bond-yellow">
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full bg-white/25 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-8 lg:px-10">
            <Link
              href="/shops"
              transitionTypes={["nav-back"]}
              className="inline-flex items-center gap-1 text-sm font-semibold text-bond-slate/80 transition-colors hover:text-bond-slate"
            >
              <ArrowLeft className="size-4" aria-hidden /> All shops
            </Link>
            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
              <ShopLogo name={shop.name} path={shop.logo_path} className="size-20 text-2xl sm:size-24" />
              <div className="min-w-0">
                <h1 className="font-display text-4xl leading-tight tracking-[-0.03em] text-bond-slate sm:text-5xl">{shop.name}</h1>
                {shop.owner_name && <p className="text-bond-slate/80">by {shop.owner_name} · Verified vendor</p>}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-bond-slate/80">
                  <RatingStars rating={rating} count={reviews.length} />
                  {shop.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-4" aria-hidden /> {shop.city}
                    </span>
                  )}
                  {kinds.includes("gift") && (
                    <span className="inline-flex items-center gap-1">
                      <Truck className="size-4" aria-hidden />
                      {fee === 0 ? "Free delivery" : `${formatPeso(fee)} delivery`}
                    </span>
                  )}
                  {shop.contact_number && (
                    <a href={`tel:${shop.contact_number}`} className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
                      <Phone className="size-4" aria-hidden /> {shop.contact_number}
                    </a>
                  )}
                </div>
              </div>
            </div>
            {(shop.tagline || shop.description) && (
              <div className="mt-5 max-w-3xl text-[0.95rem] text-bond-slate/85">
                {shop.tagline && <p className="font-semibold">{shop.tagline}</p>}
                {shop.description && <p className="mt-1 whitespace-pre-line">{shop.description}</p>}
              </div>
            )}
          </div>
          <nav aria-label="Shop sections" className="relative mx-auto max-w-7xl overflow-x-auto px-4 sm:px-8 lg:px-10">
            <ul className="flex w-max gap-1">
              {tabs.map((t) => (
                <li key={t.value}>
                  <Link
                    href={`/shops/${shop.slug}?tab=${t.value}`}
                    scroll={false}
                    replace
                    aria-current={t.value === tab ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-t-2xl px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-300",
                      t.value === tab ? "bg-bond-paper text-bond-ink" : "text-bond-slate/80 hover:bg-white/30",
                    )}
                  >
                    {t.label}
                    <span className={cn("rounded-full px-1.5 text-xs", t.value === tab ? "bg-bond-yellow/60" : "bg-white/40")}>{t.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        <MarketContent>
          <ViewTransition key={tab} enter="list-in" exit="list-out" default="none">
            <div>
              {tab === "reviews" ? (
                reviews.length === 0 ? (
                  <EmptyState icon={MessageSquareHeart} title="No reviews yet">
                    Reviews appear after customers confirm their orders.
                  </EmptyState>
                ) : (
                  <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {reviews.map((review, index) => (
                      <Reveal as="li" key={review.id} delay={Math.min(index, 6) * 50}>
                        <article className="h-full rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)]">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-bond-ink">{review.reviewer_name}</p>
                            <RatingStars rating={review.rating} />
                          </div>
                          {review.comment && <p className="mt-2 text-sm whitespace-pre-line text-bond-ink/80">{review.comment}</p>}
                          <p className="mt-2 text-xs text-bond-ink/50">{formatDateTime(review.created_at)}</p>
                        </article>
                      </Reveal>
                    ))}
                  </ul>
                )
              ) : shown.length === 0 ? (
                <EmptyState icon={PackageOpen} title="Nothing here yet">
                  This shop is still adding its products and services.
                </EmptyState>
              ) : (
                <>
                  <p className="mb-5 text-sm text-bond-ink/60">{kindMeta[tab].description}</p>
                  <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {shown.map((listing, index) => (
                      <Reveal as="li" key={listing.id} delay={Math.min(index, 8) * 50} className="flex">
                        <div className="w-full">
                          <ListingCard listing={listing} href={`/shops/${shop.slug}/items/${listing.id}`} />
                        </div>
                      </Reveal>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </ViewTransition>
        </MarketContent>
      </main>
    </PageTransition>
  );
}
