import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WizardSteps } from "@/components/marketplace/bits";
import { MarketContent, MarketHero } from "@/components/marketplace/market-hero";
import { PaymentPanel } from "@/components/marketplace/payment-panel";
import { PageTransition } from "@/components/ui/page-transition";
import { formatDateTime, formatPeso } from "@/lib/format";
import { eventSteps, eventTypeLabel, serviceCategoryLabel } from "@/lib/marketplace/constants";
import { getMyBooking } from "@/lib/marketplace/customer-data";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Payment" };

export default async function PayBookingPage({ params }: PageProps<"/bookings/[id]/pay">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const booking = await getMyBooking(id);
  if (!booking) notFound();
  const unpaid = booking.orders.filter((o) => o.status === "awaiting_payment");
  if (unpaid.length === 0) redirect(`/bookings/${booking.id}`);
  const total = unpaid.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <PageTransition>
      <main className="flex flex-1 flex-col">
        <MarketHero eyebrow={`${eventTypeLabel(booking.event_type)} · ${booking.booking_number}`} title="Payment">
          <WizardSteps steps={eventSteps} current={eventSteps.length - 1} />
        </MarketHero>
        <MarketContent>
          <div className="grid gap-6 lg:grid-cols-5">
            <section className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6 lg:col-span-3">
              <PaymentPanel target={{ type: "booking", id: booking.id }} amount={formatPeso(total)} />
            </section>
            <aside className="lg:col-span-2">
              <div className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                <h2 className="font-heading text-lg font-bold text-bond-ink">{formatDateTime(booking.event_at)}</h2>
                <p className="text-sm text-bond-ink/60">{booking.place}</p>
                <ul className="mt-4 space-y-3">
                  {unpaid.map((order) => (
                    <li key={order.id} className="rounded-2xl bg-bond-paper p-3 text-sm">
                      <p className="font-semibold text-bond-ink">{order.shop?.name}</p>
                      <ul className="mt-1 space-y-1">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex justify-between gap-3 text-bond-ink/75">
                            <span className="min-w-0 truncate">
                              {item.title} <span className="text-xs text-bond-ink/50">· {serviceCategoryLabel(item.service_category)}</span>
                            </span>
                            <span>{formatPeso(Number(item.line_total))}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-between border-t border-bond-ink/8 pt-4 font-heading text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPeso(total)}</span>
                </div>
                <p className="mt-4 text-xs text-bond-ink/55">
                  Not ready to pay? Your booking is saved in{" "}
                  <Link href={`/bookings/${booking.id}`} className="font-semibold text-bond-slate underline">
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
