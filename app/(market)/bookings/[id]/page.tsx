import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarCheck, CalendarClock, MapPin, Users } from "lucide-react";
import { AppointmentPrompt } from "@/components/marketplace/appointment-prompt";
import { OrderStatusBadge, Price } from "@/components/marketplace/bits";
import { MarketContent } from "@/components/marketplace/market-hero";
import { buttonClasses } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { formatDateTime, formatPeso } from "@/lib/format";
import { eventTypeLabel, msUntil, phInputFromNow, serviceCategoryLabel, toPhLocalInput } from "@/lib/marketplace/constants";
import { getMyBooking } from "@/lib/marketplace/customer-data";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Event booking" };

export default async function BookingPage({ params }: PageProps<"/bookings/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const booking = await getMyBooking(id);
  if (!booking) notFound();

  const unpaid = booking.orders.filter((o) => o.status === "awaiting_payment");
  const unpaidTotal = unpaid.reduce((sum, o) => sum + Number(o.total), 0);
  const active = booking.orders.filter((o) => !["awaiting_payment", "cancelled"].includes(o.status));
  const total = booking.orders.reduce((sum, o) => sum + Number(o.total), 0);
  const askAppointment = booking.appointment_status === "none" && active.length > 0 && msUntil(booking.event_at) > 2 * 3600_000;

  return (
    <PageTransition>
      <main className="flex flex-1 flex-col">
        <section className="bg-bond-yellow">
          <div className="mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-8 lg:px-10">
            <Link href="/orders" transitionTypes={["nav-back"]} className="inline-flex items-center gap-1 text-sm font-semibold text-bond-slate/80 hover:text-bond-slate">
              <ArrowLeft className="size-4" aria-hidden /> My orders
            </Link>
            <p className="mt-4 text-sm font-semibold text-bond-slate/80">{booking.booking_number}</p>
            <h1 className="font-display text-4xl tracking-[-0.03em] text-bond-slate sm:text-5xl">{eventTypeLabel(booking.event_type)}</h1>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-bond-slate/85">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-4" aria-hidden /> {formatDateTime(booking.event_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden /> {booking.place}
              </span>
              {booking.guest_count && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4" aria-hidden /> {booking.guest_count} guests
                </span>
              )}
            </div>
          </div>
        </section>

        <MarketContent>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {unpaid.length > 0 && (
                <section className="flex flex-col gap-3 rounded-3xl border border-amber-300 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-amber-950">Your booking isn&apos;t paid yet. Organizers start once you pay.</p>
                  <Link href={`/bookings/${booking.id}/pay`} className={buttonClasses({ className: "shrink-0" })}>
                    Pay {formatPeso(unpaidTotal)}
                  </Link>
                </section>
              )}

              {askAppointment && (
                <AppointmentPrompt
                  bookingId={booking.id}
                  minLocal={phInputFromNow(75 * 60_000)}
                  maxLocal={toPhLocalInput(new Date(booking.event_at))}
                />
              )}
              {booking.appointment_status === "requested" && (
                <section className="flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                  <CalendarCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <p>
                    Appointment requested for <strong>{formatDateTime(booking.appointment_at)}</strong>. Your organizers will confirm
                    or call you.
                    {booking.appointment_note && <span className="mt-1 block opacity-80">“{booking.appointment_note}”</span>}
                  </p>
                </section>
              )}

              <section>
                <h2 className="mb-3 font-heading text-lg font-bold text-bond-ink">Your organizers</h2>
                <ul className="space-y-3">
                  {booking.orders.map((order) => (
                    <li key={order.id}>
                      <Link
                        href={`/orders/${order.id}`}
                        transitionTypes={["nav-forward"]}
                        className="group block rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-heading font-semibold text-bond-ink">{order.shop?.name}</p>
                            <p className="text-xs text-bond-ink/50">{order.order_number}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <OrderStatusBadge status={order.status} kind="service" />
                            <ArrowRight className="size-5 text-bond-ink/35 transition-transform group-hover:translate-x-1" aria-hidden />
                          </div>
                        </div>
                        <ul className="mt-3 space-y-1 text-sm">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex justify-between gap-3 text-bond-ink/75">
                              <span className="min-w-0 truncate">
                                {item.title} <span className="text-xs text-bond-ink/50">· {serviceCategoryLabel(item.service_category)}</span>
                              </span>
                              <Price amount={item.line_total} />
                            </li>
                          ))}
                        </ul>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                <h2 className="font-heading text-base font-bold text-bond-ink">Summary</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-bond-ink/60">Booking type</dt>
                    <dd>{booking.mode === "package" ? "Package" : "Customized"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-bond-ink/60">Organizers</dt>
                    <dd>{booking.orders.length}</dd>
                  </div>
                  <div className="flex justify-between border-t border-bond-ink/8 pt-2 font-heading text-lg font-bold">
                    <dt>Total</dt>
                    <dd>{formatPeso(total)}</dd>
                  </div>
                </dl>
                {booking.notes && <p className="mt-4 rounded-2xl bg-bond-paper p-3 text-sm text-bond-ink/75">{booking.notes}</p>}
                <p className="mt-4 text-xs text-bond-ink/55">
                  Each organizer moves their part along. Open one to confirm it&apos;s done, report a problem or leave feedback.
                </p>
              </section>
            </aside>
          </div>
        </MarketContent>
      </main>
    </PageTransition>
  );
}
