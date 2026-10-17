import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Heart, MapPin, MessageSquareHeart, Phone, UserRound } from "lucide-react";
import { KindBadge, ListingImage, OrderStatusBadge, Price, RatingStars } from "@/components/marketplace/bits";
import { CustomerOrderActions, FeedbackForm } from "@/components/marketplace/customer-order-actions";
import { MarketContent } from "@/components/marketplace/market-hero";
import { OrderProgress, OrderTimeline } from "@/components/marketplace/order-tracking";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { formatDateTime, formatPeso } from "@/lib/format";
import { kindMeta, paymentStatusLabel, reportReasons, serviceCategoryLabel } from "@/lib/marketplace/constants";
import { getMyOrder } from "@/lib/marketplace/customer-data";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Order details" };

export default async function CustomerOrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const data = await getMyOrder(id);
  if (!data) notFound();
  const { order, items, events, review, reports } = data;
  const report = reports[0];
  const isService = order.kind === "service";

  return (
    <PageTransition>
      <main className="flex flex-1 flex-col">
        <section className="bg-bond-yellow">
          <div className="mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-8 lg:px-10">
            <Link
              href={order.booking_id ? `/bookings/${order.booking_id}` : "/orders"}
              transitionTypes={["nav-back"]}
              className="inline-flex items-center gap-1 text-sm font-semibold text-bond-slate/80 hover:text-bond-slate"
            >
              <ArrowLeft className="size-4" aria-hidden /> {order.booking_id ? "Event booking" : "My orders"}
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl tracking-[-0.03em] text-bond-slate sm:text-5xl">{order.order_number}</h1>
              <KindBadge kind={order.kind} />
              <OrderStatusBadge status={order.status} kind={order.kind} />
            </div>
            <p className="mt-1 text-sm text-bond-slate/80">
              {kindMeta[order.kind].label} from {order.shop?.name} · placed {formatDateTime(order.created_at)}
            </p>
          </div>
        </section>

        <MarketContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {order.status === "completed" && (
                <section className="overflow-hidden rounded-3xl bg-bond-slate p-6 text-white shadow-[var(--shadow-card)]">
                  <p className="flex items-center gap-2 font-heading text-xl font-bold">
                    <Heart className="size-5 fill-bond-yellow text-bond-yellow" aria-hidden /> Thank you for using BOND!
                  </p>
                  {review ? (
                    <div className="mt-3 [&_span]:text-white/85">
                      <p className="text-sm text-white/75">Your feedback</p>
                      <RatingStars rating={review.rating} />
                      {review.comment && <p className="mt-1 text-sm text-white/85">“{review.comment}”</p>}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl bg-white p-5 text-bond-ink">
                      <FeedbackForm orderId={order.id} shopName={order.shop?.name ?? "the shop"} />
                    </div>
                  )}
                </section>
              )}

              {order.status !== "completed" && (
                <Card>
                  {order.status === "awaiting_payment" ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-bond-ink/75">This order isn&apos;t paid yet. The shop starts once you pay.</p>
                      <Link href={`/orders/${order.id}/pay`} className={buttonClasses({ className: "shrink-0" })}>
                        Pay {formatPeso(Number(order.total))}
                      </Link>
                    </div>
                  ) : order.status === "cancelled" ? (
                    <p className="text-sm text-bond-ink/75">
                      This order was cancelled.{order.payment_status === "refunded" && " Your payment was refunded."}
                    </p>
                  ) : (
                    <OrderProgress kind={order.kind} status={order.status} />
                  )}
                  {order.status === "delivered" && (
                    <Alert tone="info" className="mt-5">
                      {isService
                        ? "The organizer marked the service as completed. Confirm below so BOND can release their payment."
                        : "The shop marked this as delivered. Confirm you received it so BOND can release their payment."}
                    </Alert>
                  )}
                  {report && (
                    <Alert tone={report.status === "open" ? "warning" : "info"} title={report.status === "open" ? "Problem reported" : "Report resolved"} className="mt-5">
                      <p>
                        {reportReasons.find((r) => r.value === report.reason)?.label}: {report.details}
                      </p>
                      {report.status === "open" ? (
                        <p className="mt-1 text-xs opacity-80">BOND is reviewing it. Your payment stays on hold until then.</p>
                      ) : (
                        <p className="mt-1">
                          {report.resolution === "refund" ? "You were refunded." : "The payment was released to the shop."}
                          {report.admin_note && ` ${report.admin_note}`}
                        </p>
                      )}
                    </Alert>
                  )}
                </Card>
              )}

              <Card title="Items">
                <ul className="divide-y divide-bond-ink/8">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
                      <ListingImage path={item.image_path} kind={item.kind} alt="" sizes="64px" className="size-14 shrink-0 rounded-xl" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-bond-ink">{item.title}</span>
                        <span className="text-xs text-bond-ink/55">
                          {item.service_category ? serviceCategoryLabel(item.service_category) : `× ${item.quantity}`}
                        </span>
                      </span>
                      <Price amount={item.line_total} className="font-semibold" />
                    </li>
                  ))}
                </ul>
                <dl className="mt-2 space-y-1.5 border-t border-bond-ink/8 pt-3 text-sm">
                  {Number(order.delivery_fee) > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-bond-ink/60">Delivery</dt>
                      <dd>{formatPeso(Number(order.delivery_fee))}</dd>
                    </div>
                  )}
                  <div className="flex justify-between font-heading text-base font-bold">
                    <dt>Total</dt>
                    <dd>{formatPeso(Number(order.total))}</dd>
                  </div>
                </dl>
              </Card>

              <Card title="Updates">
                <OrderTimeline events={events} viewer="customer" />
              </Card>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <Card>
                <CustomerOrderActions orderId={order.id} status={order.status} isService={isService} />
                <p className="mt-4 text-sm">
                  <span className="block text-xs font-semibold tracking-wide text-bond-ink/50 uppercase">Payment</span>
                  {paymentStatusLabel[order.payment_status]}
                </p>
              </Card>

              {!isService && (
                <Card title={order.kind === "surprise" ? "Surprise details" : "Delivery"}>
                  <ul className="space-y-3 text-sm">
                    {order.scheduled_for && (
                      <Detail icon={CalendarClock} label="When">
                        {formatDateTime(order.scheduled_for)}
                      </Detail>
                    )}
                    <Detail icon={UserRound} label="Recipient">
                      {order.recipient_name} · {order.recipient_phone}
                    </Detail>
                    <Detail icon={MapPin} label="Address">
                      {order.delivery_address}
                    </Detail>
                    {order.gift_message && (
                      <Detail icon={MessageSquareHeart} label="Message">
                        <span className="italic">“{order.gift_message}”</span>
                      </Detail>
                    )}
                  </ul>
                </Card>
              )}

              {order.shop && (
                <Card title="Shop">
                  <Link href={`/shops/${order.shop.slug}`} className="font-semibold text-bond-slate underline-offset-2 hover:underline">
                    {order.shop.name}
                  </Link>
                  {order.shop.contact_number && (
                    <a href={`tel:${order.shop.contact_number}`} className="mt-1 flex items-center gap-1.5 text-sm text-bond-ink/70">
                      <Phone className="size-3.5" aria-hidden /> {order.shop.contact_number}
                    </a>
                  )}
                </Card>
              )}
            </aside>
          </div>
        </MarketContent>
      </main>
    </PageTransition>
  );
}

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      {title && <h2 className="mb-4 font-heading text-base font-bold text-bond-ink">{title}</h2>}
      {children}
    </section>
  );
}

function Detail({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-bond-slate" aria-hidden />
      <span className="min-w-0">
        <span className="block text-xs font-semibold tracking-wide text-bond-ink/50 uppercase">{label}</span>
        <span className="text-bond-ink/85">{children}</span>
      </span>
    </li>
  );
}
