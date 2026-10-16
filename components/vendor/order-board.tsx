import { ViewTransition } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, Inbox, MapPin, UserRound } from "lucide-react";
import { EmptyState, KindBadge, OrderStatusBadge, Price } from "@/components/marketplace/bits";
import { Reveal } from "@/components/ui/reveal";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import { formatDateTime } from "@/lib/format";
import { eventTypeLabel, kindMeta, type ListingKind } from "@/lib/marketplace/constants";
import type { OrderScope, VendorOrderRow } from "@/lib/marketplace/vendor-data";
import { cn } from "@/lib/utils";

const BASE = "/dashboard/vendor/orders";

export type KindFilter = ListingKind | "all";

const kindTabs: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All orders" },
  { value: "gift", label: "Gifts" },
  { value: "surprise", label: "Surprises" },
  { value: "service", label: "Event services" },
];

const scopes: { value: OrderScope; label: string }[] = [
  { value: "action", label: "Needs action" },
  { value: "all", label: "All" },
  { value: "done", label: "Done" },
];

export const parseKindFilter = (v: unknown): KindFilter => kindTabs.find((t) => t.value === v)?.value ?? "all";
export const parseScope = (v: unknown): OrderScope => scopes.find((s) => s.value === v)?.value ?? "action";

const href = (kind: KindFilter, scope: OrderScope) => ({
  pathname: BASE,
  query: { ...(kind !== "all" && { kind }), ...(scope !== "action" && { scope }) },
});

/** Vendor Orders: one list for gifts, surprises and event services. */
export function OrderBoard({
  kind,
  scope,
  orders,
  counts,
}: {
  kind: KindFilter;
  scope: OrderScope;
  orders: VendorOrderRow[];
  counts: Record<ListingKind, number>;
}) {
  const totalAction = counts.gift + counts.surprise + counts.service;
  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow="Vendor · Orders"
        title="Orders"
        description="Paid orders appear here. Move each one along so the customer always knows where it is — they see every update."
      />
      <WorkspaceContent>
        <nav aria-label="Order type">
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kindTabs.map((tab) => {
              const active = tab.value === kind;
              const count = tab.value === "all" ? totalAction : counts[tab.value];
              return (
                <li key={tab.value}>
                  <Link
                    href={href(tab.value, scope)}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-full flex-col rounded-3xl border p-4 transition-all duration-500 ease-smooth sm:p-5",
                      active
                        ? "border-bond-slate bg-bond-slate text-white shadow-[var(--shadow-card-hover)]"
                        : "border-bond-ink/8 bg-white text-bond-ink shadow-[var(--shadow-card)] hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]",
                    )}
                  >
                    <span className="text-xs font-semibold sm:text-sm">{tab.label}</span>
                    <span className="mt-2 font-heading text-3xl font-bold">{count}</span>
                    <span className={cn("text-xs", active ? "text-white/70" : "text-bond-ink/50")}>need action</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-6 flex gap-2">
          {scopes.map((s) => (
            <Link
              key={s.value}
              href={href(kind, s.value)}
              scroll={false}
              aria-current={s.value === scope ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ease-smooth",
                s.value === scope ? "border-bond-slate bg-bond-slate text-white" : "border-bond-ink/12 bg-white text-bond-ink/75 hover:border-bond-slate/40",
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>

        <ViewTransition key={`${kind}-${scope}`} enter="list-in" exit="list-out" default="none">
          <div className="pt-6">
            {orders.length === 0 ? (
              <EmptyState icon={Inbox} title={scope === "action" ? "You're all caught up" : "No orders here yet"}>
                {scope === "action"
                  ? "New paid orders will show up here. There's no need to refresh — the list updates when you come back."
                  : "Orders appear here once customers pay."}
              </EmptyState>
            ) : (
              <ul className="space-y-3">
                {orders.map((order, index) => (
                  <Reveal as="li" key={order.id} delay={Math.min(index, 6) * 50}>
                    <OrderRow order={order} />
                  </Reveal>
                ))}
              </ul>
            )}
          </div>
        </ViewTransition>
      </WorkspaceContent>
    </main>
  );
}

function OrderRow({ order }: { order: VendorOrderRow }) {
  const items = order.items.map((i) => `${i.quantity > 1 ? `${i.quantity}× ` : ""}${i.title}`).join(", ");
  const when =
    order.kind === "service" ? order.booking?.event_at : order.kind === "surprise" ? order.scheduled_for : null;
  const where = order.kind === "service" ? order.booking?.place : order.delivery_address;
  return (
    <Link
      href={`${BASE}/${order.id}`}
      transitionTypes={["nav-forward"]}
      className="group flex flex-col gap-4 rounded-3xl border border-bond-ink/8 bg-white p-4 shadow-[var(--shadow-card)] transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:border-bond-slate/25 hover:shadow-[var(--shadow-card-hover)] sm:p-5 lg:flex-row lg:items-center"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-heading font-bold text-bond-ink">{order.order_number}</span>
          <KindBadge kind={order.kind} className="bg-bond-yellow/40! shadow-none!" />
          {order.booking && <span className="text-xs text-bond-ink/55">{eventTypeLabel(order.booking.event_type)}</span>}
        </div>
        <p className="mt-1 truncate text-sm text-bond-ink/75">{items || kindMeta[order.kind].label}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-bond-ink/60">
          <span className="inline-flex items-center gap-1">
            <UserRound className="size-3.5" aria-hidden />
            {order.kind === "service" ? order.customer_name : (order.recipient_name ?? order.customer_name)}
          </span>
          {when && (
            <span className="inline-flex items-center gap-1 font-semibold text-bond-slate">
              <CalendarClock className="size-3.5" aria-hidden />
              {formatDateTime(when)}
            </span>
          )}
          {where && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{where}</span>
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 lg:justify-end lg:gap-5">
        <Price amount={order.total} className="font-heading font-bold text-bond-ink" />
        <OrderStatusBadge status={order.status} kind={order.kind} />
        <ArrowRight className="size-5 text-bond-ink/35 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
      </div>
    </Link>
  );
}
