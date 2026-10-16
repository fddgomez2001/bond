import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingImage, WizardSteps } from "@/components/marketplace/bits";
import { CheckoutForm } from "@/components/marketplace/checkout-form";
import { MarketContent, MarketHero } from "@/components/marketplace/market-hero";
import { PageTransition } from "@/components/ui/page-transition";
import { requireRole } from "@/lib/auth/session";
import { formatPeso } from "@/lib/format";
import { giftSteps } from "@/lib/marketplace/constants";
import { getCart } from "@/lib/marketplace/customer-data";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [{ profile }, cart] = await Promise.all([requireRole("customer"), getCart()]);
  const lines = cart.lines.filter((l) => l.available);
  if (!cart.shop || lines.length === 0) redirect("/cart");

  return (
    <PageTransition>
      <main className="flex flex-1 flex-col">
        <MarketHero eyebrow="Send a gift" title="Checkout">
          <WizardSteps steps={giftSteps} current={2} />
        </MarketHero>
        <MarketContent>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CheckoutForm
                shopId={cart.shop.id}
                total={formatPeso(cart.total)}
                defaults={{ recipientName: "", recipientPhone: "" }}
              />
            </div>
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-heading text-lg font-bold text-bond-ink">{cart.shop.name}</h2>
                  <Link href="/cart" className="text-sm font-semibold text-bond-slate underline underline-offset-2">
                    Edit cart
                  </Link>
                </div>
                <ul className="mt-4 space-y-3">
                  {lines.map((line) => (
                    <li key={line.listingId} className="flex items-center gap-3 text-sm">
                      <ListingImage path={line.imagePath} kind="gift" alt="" sizes="56px" className="size-12 shrink-0 rounded-xl" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-bond-ink">{line.title}</span>
                        <span className="text-xs text-bond-ink/55">× {line.quantity}</span>
                      </span>
                      <span className="font-semibold">{formatPeso(line.price * line.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-4 space-y-2 border-t border-bond-ink/8 pt-4 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-bond-ink/60">Subtotal</dt>
                    <dd>{formatPeso(cart.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-bond-ink/60">Delivery fee</dt>
                    <dd>{cart.deliveryFee === 0 ? "Free" : formatPeso(cart.deliveryFee)}</dd>
                  </div>
                  <div className="flex justify-between font-heading text-lg font-bold">
                    <dt>Total</dt>
                    <dd>{formatPeso(cart.total)}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-bond-ink/55">
                  Ordering as {[profile.first_name, profile.last_name].filter(Boolean).join(" ") || "you"}. The shop sees your name
                  and number in case they need you.
                </p>
              </div>
            </aside>
          </div>
        </MarketContent>
      </main>
    </PageTransition>
  );
}
