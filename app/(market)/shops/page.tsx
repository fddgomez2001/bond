import { ViewTransition } from "react";
import type { Metadata } from "next";
import { Store } from "lucide-react";
import { EmptyState } from "@/components/marketplace/bits";
import { ShopCard } from "@/components/marketplace/cards";
import { MarketContent, MarketHero } from "@/components/marketplace/market-hero";
import { ShopFilters, parseOffer } from "@/components/marketplace/shop-filters";
import { PageTransition } from "@/components/ui/page-transition";
import { Reveal } from "@/components/ui/reveal";
import { listShops } from "@/lib/marketplace/catalog";

export const metadata: Metadata = {
  title: "Shops",
  description: "Browse verified BOND shops for gifts, surprises and event services.",
};

export default async function ShopsPage({ searchParams }: PageProps<"/shops">) {
  const params = await searchParams;
  const offer = parseOffer(params.offer);
  const query = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const shops = await listShops({ offer, query });

  return (
    <PageTransition>
      <main className="flex flex-1 flex-col">
        <MarketHero
          eyebrow="Verified vendors only"
          title="Shops & vendors"
          description="Every shop on BOND belongs to a vendor our team has verified. Pick a shop to see its gifts, surprises and event services."
        >
          <ShopFilters base="/shops" offer={offer} query={query} />
        </MarketHero>
        <MarketContent>
          <ViewTransition key={`${offer}-${query}`} enter="list-in" exit="list-out" default="none">
            <div>
              <p className="mb-5 text-sm text-bond-ink/60">
                {shops.length} shop{shops.length === 1 ? "" : "s"}
                {query && <> matching “{query}”</>}
              </p>
              {shops.length === 0 ? (
                <EmptyState icon={Store} title={query || offer ? "No shops match" : "Shops are opening soon"}>
                  {query || offer
                    ? "Try another search or category."
                    : "Verified vendors are setting up their shops. Check back soon!"}
                </EmptyState>
              ) : (
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {shops.map((shop, index) => (
                    <Reveal as="li" key={shop.id} delay={Math.min(index, 8) * 60} className="flex">
                      <div className="w-full">
                        <ShopCard shop={shop} />
                      </div>
                    </Reveal>
                  ))}
                </ul>
              )}
            </div>
          </ViewTransition>
        </MarketContent>
      </main>
    </PageTransition>
  );
}
