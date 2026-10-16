import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart, Store } from "lucide-react";
import { EmptyState, WizardSteps } from "@/components/marketplace/bits";
import { ShopCard } from "@/components/marketplace/cards";
import { MarketContent, MarketHero } from "@/components/marketplace/market-hero";
import { ShopFilters } from "@/components/marketplace/shop-filters";
import { buttonClasses } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { Reveal } from "@/components/ui/reveal";
import { requireRole } from "@/lib/auth/session";
import { listShops } from "@/lib/marketplace/catalog";
import { giftSteps } from "@/lib/marketplace/constants";
import { cartCount } from "@/lib/marketplace/customer-data";

export const metadata: Metadata = { title: "Send a gift" };

/** Gift flow, step 1: pick the store the gifts come from. */
export default async function GiftOrderPage({ searchParams }: PageProps<"/order/gift">) {
  const [, params] = await Promise.all([requireRole("customer"), searchParams]);
  const query = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const [shops, inCart] = await Promise.all([listShops({ offer: "gift", query }), cartCount()]);

  return (
    <PageTransition>
      <main className="flex flex-1 flex-col">
        <MarketHero
          eyebrow="Send a gift"
          title="Choose a store"
          description="Pick a shop, add its gifts to your cart, then tell us who it's for. The shop prepares and delivers it."
        >
          <div className="space-y-5">
            <WizardSteps steps={giftSteps} current={0} />
            <ShopFilters base="/order/gift" offer={null} query={query} showOffers={false} />
          </div>
        </MarketHero>
        <MarketContent>
          {inCart > 0 && (
            <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-bond-ink/8 bg-white p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm text-bond-ink/75">
                <ShoppingCart className="size-5 text-bond-slate" aria-hidden />
                You have {inCart} item{inCart === 1 ? "" : "s"} in your cart.
              </p>
              <Link href="/cart" className={buttonClasses({ variant: "gold", size: "sm" })}>
                Continue to cart
              </Link>
            </div>
          )}
          {shops.length === 0 ? (
            <EmptyState icon={Store} title={query ? "No gift shops match" : "No gift shops yet"}>
              {query ? "Try a different search." : "Verified vendors are adding their gifts. Check back soon!"}
            </EmptyState>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop, index) => (
                <Reveal as="li" key={shop.id} delay={Math.min(index, 8) * 60} className="flex">
                  <div className="w-full">
                    <ShopCard shop={shop} href={`/shops/${shop.slug}?tab=gift`} />
                  </div>
                </Reveal>
              ))}
            </ul>
          )}
        </MarketContent>
      </main>
    </PageTransition>
  );
}
