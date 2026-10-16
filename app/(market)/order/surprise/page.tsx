import type { Metadata } from "next";
import { MarketContent, MarketHero } from "@/components/marketplace/market-hero";
import { SurpriseWizard } from "@/components/marketplace/surprise-wizard";
import { PageTransition } from "@/components/ui/page-transition";
import { requireRole } from "@/lib/auth/session";
import { listOptions } from "@/lib/marketplace/catalog";
import { phInputFromNow } from "@/lib/marketplace/constants";

export const metadata: Metadata = { title: "Plan a surprise" };

/** Same 3-hour lead time the database enforces, plus a few minutes to fill the form. */
const LEAD_TIME_MS = (3 * 60 + 10) * 60 * 1000;

export default async function SurpriseOrderPage({ searchParams }: PageProps<"/order/surprise">) {
  const [, params] = await Promise.all([requireRole("customer"), searchParams]);
  const options = await listOptions("surprise");
  const initial = typeof params.listing === "string" && options.some((o) => o.id === params.listing) ? params.listing : null;

  return (
    <PageTransition>
      <main className="flex flex-1 flex-col">
        <MarketHero
          eyebrow="Plan a surprise"
          title="Make their day"
          description="Choose when, who and what. The shop calls the recipient beforehand and delivers the surprise right on time."
        />
        <MarketContent>
          <SurpriseWizard options={options} minLocal={phInputFromNow(LEAD_TIME_MS)} initialListing={initial} />
        </MarketContent>
      </main>
    </PageTransition>
  );
}
