import { ViewTransition } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, CalendarHeart, Gift, PartyPopper, Receipt } from "lucide-react";
import { EmptyState, KindBadge, ListingImage, OrderStatusBadge, Price } from "@/components/marketplace/bits";
import { MarketContent, MarketHero } from "@/components/marketplace/market-hero";
import { buttonClasses } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { Reveal } from "@/components/ui/reveal";
import { formatDateTime } from "@/lib/format";
import { eventTypeLabel } from "@/lib/marketplace/constants";
import { getMyOrders, type BookingSummary, type OrderSummary } from "@/lib/marketplace/customer-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My orders" };

type Tab = "active" | "done" | "all";
const tabs: { value: Tab; label: string }[] = [
  { value: "active", label: "In progress" },
  { value: "done", label: "Completed & cancelled" },
  { value: "all", label: "All" },
];

const finished = (status: string) => ["completed", "cancelled"].includes(status);

type Entry = { type: "order"; at: string; done: boolean; order: OrderSummary } | { type: "booking"; at: string; done: boolean; booking: BookingSummary };

export default async function MyOrdersPage({ searchParams }: PageProps<"/orders">) {
  const params = await searchParams;
  const tab = tabs.find((t) => t.value === params.tab)?.value ?? "active";
  const { orders, bookings } = await getMyOrders();

  const entries: Entry[] = [
    ...orders.map((order) => ({ type: "order" as const, at: order.created_at, done: finished(order.status), order })),
    ...bookings.map((booking) => ({
      type: "booking" as const,
      at: booking.created_at,
      done: booking.orders.length > 0 && booking.orders.every((o) => finished(o.status)),
      booking,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const shown = entries.filter((e) => (tab === "all" ? true : tab === "done" ? e.done : !e.done));

  return (
    <PageTransition>
      <main className="flex flex-1 flex-col">
        <MarketHero eyebrow="Track everything in one place" title="My orders">
          <nav aria-label="Filter orders" className="-mx-1 overflow-x-auto px-1 pb-1">
            <ul className="flex w-max gap-2">
              {tabs.map((t) => (
                <li key={t.value}>
                  <Link
                    href={t.value === "active" ? "/orders" : `/orders?tab=${t.value}`}
                    scroll={false}
                    replace
                    aria-current={t.value === tab ? "page" : undefined}
                    className={cn(
                      "inline-flex rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-smooth",
                      t.value === tab ? "bg-bond-slate text-white shadow-md" : "bg-white/60 text-bond-slate hover:bg-white",
                    )}
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </MarketHero>
        <MarketContent>
          <ViewTransition key={tab} enter="list-in" exit="list-out" default="none">
            <div>
              {shown.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title={tab === "active" ? "Nothing in progress" : "No orders here yet"}
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      <Link href="/order/gift" className={buttonClasses({ variant: "gold", size: "sm" })}>
                        <Gift className="size-4" aria-hidden /> Send a gift
                      </Link>
                      <Link href="/order/surprise" className={buttonClasses({ variant: "outline", size: "sm" })}>
                        <PartyPopper className="size-4" aria-hidden /> Plan a surprise
                      </Link>
                      <Link href="/order/event" className={buttonClasses({ variant: "outline", size: "sm" })}>
                        <CalendarHeart className="size-4" aria-hidden /> Book event services
                      </Link>
                    </div>
                  }
                >
                  Your gifts, surprises and event bookings show up here with live status updates.
                </EmptyState>
              ) : (
                <ul className="space-y-3">
                  {shown.map((entry, index) => (
                    <Reveal as="li" key={entry.type === "order" ? entry.order.id : entry.booking.id} delay={Math.min(index, 6) * 50}>
                      {entry.type === "order" ? <OrderCard order={entry.order} /> : <BookingCard booking={entry.booking} />}
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

const cardClass =
  "group flex flex-col gap-4 rounded-3xl border border-bond-ink/8 bg-white p-4 shadow-[var(--shadow-card)] transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] sm:flex-row sm:items-center sm:p-5";

function OrderCard({ order }: { order: OrderSummary }) {
  const first = order.items[0];
  const more = order.items.length - 1;
  return (
    <Link href={`/orders/${order.id}`} transitionTypes={["nav-forward"]} className={cardClass}>
      <ListingImage path={first?.image_path ?? null} kind={order.kind} alt="" sizes="112px" className="aspect-[4/3] w-24 shrink-0 rounded-2xl" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind={order.kind} className="bg-bond-yellow/40! shadow-none!" />
          <span className="text-xs text-bond-ink/50">{order.order_number}</span>
        </div>
        <p className="mt-1 truncate font-heading font-semibold text-bond-ink">
          {first?.title ?? "Order"}
          {more > 0 && <span className="font-normal text-bond-ink/55"> + {more} more</span>}
        </p>
        <p className="truncate text-sm text-bond-ink/60">
          {order.shop?.name}
          {order.scheduled_for ? ` · ${formatDateTime(order.scheduled_for)}` : ` · ${formatDateTime(order.created_at)}`}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <Price amount={order.total} className="font-heading font-bold text-bond-ink" />
        <OrderStatusBadge status={order.status} kind={order.kind} />
        <ArrowRight className="hidden size-5 text-bond-ink/35 transition-transform group-hover:translate-x-1 sm:block" aria-hidden />
      </div>
    </Link>
  );
}

function BookingCard({ booking }: { booking: BookingSummary }) {
  const total = booking.orders.reduce((sum, o) => sum + Number(o.total), 0);
  const unpaid = booking.orders.some((o) => o.status === "awaiting_payment");
  const allDone = booking.orders.length > 0 && booking.orders.every((o) => o.status === "completed");
  return (
    <Link href={`/bookings/${booking.id}`} transitionTypes={["nav-forward"]} className={cardClass}>
      <span className="flex aspect-[4/3] w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-bond-slate to-bond-slate-light text-white">
        <CalendarHeart className="size-9" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind="service" className="bg-bond-yellow/40! shadow-none!" />
          <span className="text-xs text-bond-ink/50">{booking.booking_number}</span>
        </div>
        <p className="mt-1 truncate font-heading font-semibold text-bond-ink">
          {eventTypeLabel(booking.event_type)} · {booking.mode === "package" ? "Package" : "Customized"}
        </p>
        <p className="flex items-center gap-1 truncate text-sm text-bond-ink/60">
          <CalendarClock className="size-3.5 shrink-0" aria-hidden /> {formatDateTime(booking.event_at)} · {booking.place}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <Price amount={total} className="font-heading font-bold text-bond-ink" />
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap",
            unpaid ? "bg-amber-100 text-amber-900" : allDone ? "bg-emerald-100 text-emerald-900" : "bg-sky-100 text-sky-900",
          )}
        >
          {unpaid ? "Awaiting payment" : allDone ? "Completed" : `${booking.orders.length} organizer${booking.orders.length === 1 ? "" : "s"}`}
        </span>
        <ArrowRight className="hidden size-5 text-bond-ink/35 transition-transform group-hover:translate-x-1 sm:block" aria-hidden />
      </div>
    </Link>
  );
}
