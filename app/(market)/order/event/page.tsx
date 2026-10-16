import type { Metadata } from "next";
import { EventWizard } from "@/components/marketplace/event-wizard";
import { MarketContent, MarketHero } from "@/components/marketplace/market-hero";
import { PageTransition } from "@/components/ui/page-transition";
import { requireRole } from "@/lib/auth/session";
import { listOptions } from "@/lib/marketplace/catalog";
import { phInputFromNow } from "@/lib/marketplace/constants";

export const metadata: Metadata = { title: "Book event services" };

/** The database requires events at least a day ahead; leave a few minutes to fill the form. */
const LEAD_TIME_MS = (24 * 60 + 10) * 60 * 1000;

export default async function EventOrderPage({ searchParams }: PageProps<"/order/event">) {
  const [, params] = await Promise.all([requireRole("customer"), searchParams]);
  const options = await listOptions("service");
  const initial = typeof params.listing === "string" && options.some((o) => o.id === params.listing) ? params.listing : null;

  return (
    <PageTransition>
      <main className="flex flex-1 flex-col">
        <MarketHero
          eyebrow="Event services"
          title="Plan your event"
          description="Book a ready-made package, or customize your event service by service — venue, catering, photo & video and more."
        />
        <MarketContent>
          <EventWizard options={options} minLocal={phInputFromNow(LEAD_TIME_MS)} initialListing={initial} />
        </MarketContent>
      </main>
    </PageTransition>
  );
}
