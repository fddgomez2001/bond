import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Flag, MapPin, MessageSquareHeart, Phone, PhoneCall, Users } from "lucide-react";
import { KindBadge, OrderStatusBadge, Price } from "@/components/marketplace/bits";
import { OrderProgress, OrderTimeline } from "@/components/marketplace/order-tracking";
import { Alert } from "@/components/ui/alert";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import { formatDateTime } from "@/lib/format";
import { eventTypeLabel, reportReasons, serviceCategoryLabel, vendorActionsFor, type PaymentStatus } from "@/lib/marketplace/constants";
import type { getShopOrder } from "@/lib/marketplace/vendor-data";
import { VendorOrderActions } from "./order-actions";

type Data = NonNullable<Awaited<ReturnType<typeof getShopOrder>>>;

const vendorPayment: Record<PaymentStatus, string> = {
  unpaid: "Not paid yet",
  held: "Paid — BOND holds it until the customer confirms",
  released: "Released to you",
  refunded: "Refunded to the customer",
};

const nextStepCopy: Partial<Record<string, string>> = {
  paid: "New order — start preparing it, or decline with a reason (the customer is refunded).",
  confirmed: "Booking confirmed. Start preparing when you're ready.",
  preparing: "Mark it ready once it's prepared.",
  ready: "Out for delivery / ready to serve. Update it once it's done.",
  delivery_failed: "The last delivery attempt failed. Try again or mark it delivered.",
  delivered: "Waiting for the customer to confirm. The payment is released to you when they do.",
  completed: "Completed — the payment has been released to you.",
  cancelled: "This order was cancelled.",
  disputed: "The customer reported a problem. BOND is reviewing it and will refund or release the payment.",
};

export function VendorOrderDetail({ data }: { data: Data }) {
  const { order, items, events, reports } = data;
  const booking = order.booking;
  const actions = vendorActionsFor(order.kind, order.status);
  const callNumber = order.kind === "service" ? order.customer_phone : order.recipient_phone;
  const openReport = reports.find((r) => r.status === "open");

  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow={
          <Link href="/dashboard/vendor/orders" transitionTypes={["nav-back"]} className="inline-flex items-center gap-1 hover:text-bond-slate">
            <ArrowLeft className="size-3.5" aria-hidden /> Orders
          </Link>
        }
        title={order.order_number}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <KindBadge kind={order.kind} />
            <OrderStatusBadge status={order.status} kind={order.kind} />
            <span className="text-sm">Placed {formatDateTime(order.created_at)}</span>
          </span>
        }
      />

      <WorkspaceContent>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <OrderProgress kind={order.kind} status={order.status} />
              {openReport && (
                <Alert tone="error" title="Problem reported" className="mt-5">
                  <p>
                    <span className="font-semibold">{reportReasons.find((r) => r.value === openReport.reason)?.label}:</span>{" "}
                    {openReport.details}
                  </p>
                  <p className="mt-1 text-xs opacity-80">BOND will contact you if needed, then refund or release the payment.</p>
                </Alert>
              )}
            </Card>

            {order.kind === "surprise" && ["paid", "preparing"].includes(order.status) && order.recipient_phone && (
              <Alert tone="info" title="Call the recipient before the surprise">
                Coordinate with {order.recipient_name} at{" "}
                <a href={`tel:${order.recipient_phone}`} className="font-semibold underline">
                  {order.recipient_phone}
                </a>{" "}
                — confirm they&apos;ll be there on {formatDateTime(order.scheduled_for)}, without spoiling it.
              </Alert>
            )}

            <Card title="Items">
              <ul className="divide-y divide-bond-ink/8">
                {items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                    <span>
                      <span className="font-semibold text-bond-ink">{item.title}</span>
                      <span className="block text-xs text-bond-ink/55">
                        {item.service_category ? serviceCategoryLabel(item.service_category) : `Qty ${item.quantity}`} ·{" "}
                        <Price amount={item.unit_price} /> each
                      </span>
                    </span>
                    <Price amount={item.line_total} className="font-semibold text-bond-ink" />
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1.5 border-t border-bond-ink/8 pt-3 text-sm">
                <Row label="Subtotal" value={<Price amount={order.subtotal} />} />
                {Number(order.delivery_fee) > 0 && <Row label="Delivery fee" value={<Price amount={order.delivery_fee} />} />}
                <Row label="Total" value={<Price amount={order.total} className="font-heading text-base font-bold text-bond-ink" />} />
              </dl>
            </Card>

            {booking ? (
              <Card title="Event details">
                <ul className="space-y-3 text-sm">
                  <Detail icon={Users} label="Event">
                    {eventTypeLabel(booking.event_type)} · {booking.mode === "package" ? "Package" : "Customized"} · {booking.booking_number}
                  </Detail>
                  <Detail icon={CalendarClock} label="Date & time">
                    {formatDateTime(booking.event_at)}
                  </Detail>
                  <Detail icon={MapPin} label="Place">
                    {booking.place}
                    {booking.guest_count ? ` · ${booking.guest_count} guests` : ""}
                  </Detail>
                  {booking.notes && <Detail icon={MessageSquareHeart} label="Customer notes">{booking.notes}</Detail>}
                </ul>
                <div className="mt-4 rounded-2xl bg-bond-paper p-4 text-sm">
                  <p className="font-semibold text-bond-ink">Appointment</p>
                  <p className="mt-1 text-bond-ink/70">
                    {booking.appointment_status === "requested"
                      ? `Requested for ${formatDateTime(booking.appointment_at)}${booking.appointment_note ? ` — “${booking.appointment_note}”` : ""}`
                      : booking.appointment_status === "skipped"
                        ? "The customer skipped the appointment. Contact them if you need details."
                        : "The customer hasn't asked for an appointment yet."}
                  </p>
                </div>
              </Card>
            ) : (
              <Card title={order.kind === "surprise" ? "Surprise details" : "Delivery details"}>
                <ul className="space-y-3 text-sm">
                  {order.scheduled_for && (
                    <Detail icon={CalendarClock} label="Deliver on">
                      <span className="font-semibold text-bond-slate">{formatDateTime(order.scheduled_for)}</span>
                    </Detail>
                  )}
                  <Detail icon={Users} label="Recipient">
                    {order.recipient_name}
                    {order.recipient_phone && (
                      <>
                        {" · "}
                        <a href={`tel:${order.recipient_phone}`} className="font-semibold text-bond-slate underline">
                          {order.recipient_phone}
                        </a>
                      </>
                    )}
                  </Detail>
                  <Detail icon={MapPin} label="Address">
                    {order.delivery_address}
                  </Detail>
                  {order.gift_message && (
                    <Detail icon={MessageSquareHeart} label="Message to include">
                      <span className="italic">“{order.gift_message}”</span>
                    </Detail>
                  )}
                  {order.delivery_notes && <Detail icon={Flag} label="Notes">{order.delivery_notes}</Detail>}
                </ul>
              </Card>
            )}

            <Card title="Timeline">
              <OrderTimeline events={events} viewer="vendor" />
            </Card>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card title="Next step">
              <p className="text-sm text-bond-ink/70">{nextStepCopy[order.status]}</p>
              {actions.length > 0 && (
                <div className="mt-4">
                  <VendorOrderActions orderId={order.id} actions={actions} />
                </div>
              )}
            </Card>
            <Card title="Customer">
              <p className="text-sm font-semibold text-bond-ink">{order.customer_name ?? "BOND customer"}</p>
              {order.customer_phone && (
                <a href={`tel:${order.customer_phone}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-bond-slate underline">
                  <Phone className="size-3.5" aria-hidden /> {order.customer_phone}
                </a>
              )}
              {callNumber && order.kind !== "gift" && (
                <a
                  href={`tel:${callNumber}`}
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-bond-yellow px-4 py-2.5 text-sm font-semibold text-bond-ink transition-colors hover:bg-bond-gold"
                >
                  <PhoneCall className="size-4" aria-hidden />
                  {order.kind === "surprise" ? "Call the recipient" : "Call the customer"}
                </a>
              )}
            </Card>
            <Card title="Payment">
              <p className="text-sm text-bond-ink/75">{vendorPayment[order.payment_status]}</p>
              <Price amount={order.total} className="mt-1 block font-heading text-2xl font-bold text-bond-ink" />
            </Card>
          </aside>
        </div>
      </WorkspaceContent>
    </main>
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

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-bond-ink/60">{label}</dt>
      <dd className="text-bond-ink">{value}</dd>
    </div>
  );
}

function Detail({ icon: Icon, label, children }: { icon: typeof Users; label: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-bond-slate" aria-hidden />
      <span>
        <span className="block text-xs font-semibold tracking-wide text-bond-ink/50 uppercase">{label}</span>
        <span className="text-bond-ink/85">{children}</span>
      </span>
    </li>
  );
}
