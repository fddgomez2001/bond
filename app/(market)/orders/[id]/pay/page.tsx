import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ListingImage, WizardSteps } from "@/components/marketplace/bits";
import { MarketContent, MarketHero } from "@/components/marketplace/market-hero";
import { PaymentPanel } from "@/components/marketplace/payment-panel";
import { PageTransition } from "@/components/ui/page-transition";
import { formatDateTime, formatPeso } from "@/lib/format";
import { giftSteps, kindMeta, surpriseSteps } from "@/lib/marketplace/constants";
import { getMyOrder } from "@/lib/marketplace/customer-data";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Payment" };

export default async function PayOrderPage({ params }: PageProps<"/orders/[id]/pay">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const data = await getMyOrder(id);
  if (!data) notFound();
  const { order, items } = data;
  // Event orders are paid together on their booking.
  if (order.booking_id) redirect(`/bookings/${order.booking_id}/pay`);
  if (order.status !== "awaiting_payment") redirect(`/orders/${order.id}`);
  const steps = order.kind === "surprise" ? surpriseSteps : giftSteps;

  return (
    <PageTransition>
      <main className="flex flex-1 flex-col">
        <MarketHero eyebrow={`${kindMeta[order.kind].label} · ${order.order_number}`} title="Payment">
          <WizardSteps steps={steps} current={steps.length - 1} />
        </MarketHero>
        <MarketContent>
          <div className="grid gap-6 lg:grid-cols-5">
            <section className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6 lg:col-span-3">
              <PaymentPanel target={{ type: "order", id: order.id }} amount={formatPeso(Number(order.total))} />
            </section>
            <aside className="lg:col-span-2">
              <div className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                <h2 className="font-heading text-lg font-bold text-bond-ink">{order.shop?.name}</h2>
                {order.scheduled_for && <p className="text-sm text-bond-ink/60">Surprise on {formatDateTime(order.scheduled_for)}</p>}
                <ul className="mt-4 space-y-3">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 text-sm">
                      <ListingImage path={item.image_path} kind={item.kind} alt="" sizes="56px" className="size-12 shrink-0 rounded-xl" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{item.title}</span>
                        <span className="text-xs text-bond-ink/55">× {item.quantity}</span>
                      </span>
                      <span className="font-semibold">{formatPeso(Number(item.line_total))}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-4 space-y-2 border-t border-bond-ink/8 pt-4 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-bond-ink/60">Subtotal</dt>
                    <dd>{formatPeso(Number(order.subtotal))}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-bond-ink/60">Delivery</dt>
                    <dd>{Number(order.delivery_fee) ? formatPeso(Number(order.delivery_fee)) : "Free"}</dd>
                  </div>
                  <div className="flex justify-between font-heading text-lg font-bold">
                    <dt>Total</dt>
                    <dd>{formatPeso(Number(order.total))}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-bond-ink/55">
                  Not ready to pay? Your order is saved in{" "}
                  <Link href={`/orders/${order.id}`} className="font-semibold text-bond-slate underline">
                    My Orders
                  </Link>
                  .
                </p>
              </div>
            </aside>
          </div>
        </MarketContent>
      </main>
    </PageTransition>
  );
}
