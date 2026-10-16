import type { Metadata } from "next";
import { WizardSteps } from "@/components/marketplace/bits";
import { CartView } from "@/components/marketplace/cart-view";
import { MarketContent, MarketHero } from "@/components/marketplace/market-hero";
import { PageTransition } from "@/components/ui/page-transition";
import { giftSteps } from "@/lib/marketplace/constants";
import { getCart } from "@/lib/marketplace/customer-data";

export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage() {
  const cart = await getCart();
  return (
    <PageTransition>
      <main className="flex flex-1 flex-col">
        <MarketHero eyebrow="Send a gift" title="Your cart">
          <WizardSteps steps={giftSteps} current={1} />
        </MarketHero>
        <MarketContent>
          <CartView cart={cart} />
        </MarketContent>
      </main>
    </PageTransition>
  );
}
